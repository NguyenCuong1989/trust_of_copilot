import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timezone
from urllib import error, request


class APO_Monolith_System:
    NOTION_API_VERSION = "2022-06-28"
    NOTION_BASE_URL = "https://api.notion.com/v1"

    def __init__(self, initial_capital=859.92):
        self.CAPITAL = initial_capital
        self.BASE_RISK = 0.01
        self.MAX_RISK_CAP = 0.02
        self.SURVIVAL_THRESHOLD = 2
        self.OODA_BRAKE_R = 0.5
        self.notion_token = os.getenv("NOTION_API_KEY") or os.getenv("NOTION_TOKEN")
        self.truth_vault_database_id = os.getenv(
            "APO_TRUTH_VAULT_DATABASE_ID",
            "9ab56d1fbd7f42c6a02f677ac55127d6",
        )
        self.truth_vault = self._load_vault()
        self.is_holding = False
        self.current_position = None

    def _iso_now(self):
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
            "+00:00", "Z"
        )

    def _notion_headers(self):
        if not self.notion_token:
            raise RuntimeError(
                "NOTION_API_KEY or NOTION_TOKEN is required to access APO_TRUTH_VAULT"
            )
        return {
            "Authorization": f"Bearer {self.notion_token}",
            "Content-Type": "application/json",
            "Notion-Version": self.NOTION_API_VERSION,
        }

    def _notion_request(self, method, path, payload=None):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        req = request.Request(
            f"{self.NOTION_BASE_URL}{path}",
            data=data,
            headers=self._notion_headers(),
            method=method,
        )
        try:
            with request.urlopen(req, timeout=30) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(
                f"Notion API request failed ({exc.code}) for {method} {path}: {body}"
            ) from exc

    def _page_to_text(self, page, property_name):
        prop = page.get("properties", {}).get(property_name, {})
        prop_type = prop.get("type")
        if prop_type == "title":
            return "".join(item.get("plain_text", "") for item in prop.get("title", []))
        if prop_type == "rich_text":
            return "".join(item.get("plain_text", "") for item in prop.get("rich_text", []))
        return ""

    def _page_to_number(self, page, property_name):
        prop = page.get("properties", {}).get(property_name, {})
        if prop.get("type") == "number":
            value = prop.get("number")
            return 0 if value is None else int(float(value))
        return 0

    def _page_to_date(self, page, property_name):
        prop = page.get("properties", {}).get(property_name, {})
        if prop.get("type") == "date":
            date_value = prop.get("date") or {}
            return date_value.get("start") or self._iso_now()
        return self._iso_now()

    def _build_properties(self, vector_id, record):
        last_updated = record.get("last_updated") or self._iso_now()
        return {
            "Name": {
                "title": [
                    {
                        "type": "text",
                        "text": {"content": vector_id},
                    }
                ]
            },
            "Vector_ID": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": vector_id},
                    }
                ]
            },
            "Win": {"number": int(record.get("win", 0))},
            "Loss": {"number": int(record.get("loss", 0))},
            "Samples": {"number": int(record.get("samples", 0))},
            "Last_Updated": {"date": {"start": last_updated}},
        }

    def _load_vault(self):
        vault = {}
        self._vault_pages = {}
        start_cursor = None
        while True:
            payload = {"page_size": 100}
            if start_cursor:
                payload["start_cursor"] = start_cursor
            response = self._notion_request(
                "POST", f"/databases/{self.truth_vault_database_id}/query", payload
            )
            for page in response.get("results", []):
                vector_id = self._page_to_text(page, "Vector_ID").strip()
                if not vector_id:
                    vector_id = self._page_to_text(page, "Name").strip()
                if not vector_id:
                    continue
                vault[vector_id] = {
                    "win": self._page_to_number(page, "Win"),
                    "loss": self._page_to_number(page, "Loss"),
                    "samples": self._page_to_number(page, "Samples"),
                    "last_updated": self._page_to_date(page, "Last_Updated"),
                }
                self._vault_pages[vector_id] = page.get("id")
            if not response.get("has_more"):
                break
            start_cursor = response.get("next_cursor")
        return vault

    def _save_vault(self):
        for vector_id, record in self.truth_vault.items():
            record.setdefault("last_updated", self._iso_now())
            properties = self._build_properties(vector_id, record)
            page_id = self._vault_pages.get(vector_id)
            if page_id:
                self._notion_request("PATCH", f"/pages/{page_id}", {"properties": properties})
            else:
                response = self._notion_request(
                    "POST",
                    "/pages",
                    {
                        "parent": {"database_id": self.truth_vault_database_id},
                        "properties": properties,
                    },
                )
                self._vault_pages[vector_id] = response.get("id")

    def get_context_vector(self, btc_row, alt_row, current_time=None):
        ts = current_time if current_time else datetime.now()
        hour = ts.hour
        session = "ASIA" if 0 <= hour < 8 else "LONDON" if 8 <= hour < 16 else "NY"
        gravity = "UNKNOWN"
        if 'atr_pct' in btc_row:
            btc_atr = btc_row['atr_pct']
            gravity = "PANIC" if btc_atr > 2.0 else "SIDEWAY" if btc_atr < 0.8 else "TREND"
        energy = "STABLE"
        if 'atr_pct' in alt_row:
            energy = "HIGH" if alt_row['atr_pct'] > 1.2 else "STABLE"
        liquidity = "THIN"
        if 'vol_ma' in alt_row and alt_row['volume'] > alt_row['vol_ma']:
            liquidity = "HEALTHY"
        return {"gravity": gravity, "energy": energy, "liquidity": liquidity, "session": session}

    def generate_vector_id(self, context):
        return f"{context['gravity']}_{context['session']}_{context['liquidity']}_{context['energy']}"

    def calculate_market_brain_risk(self, context):
        v_id = self.generate_vector_id(context)
        current_session = context['session']
        if v_id not in self.truth_vault:
            return 0.0025, "SCOUT (NO DATA)", "NORMAL"
        stats = self.truth_vault[v_id]
        samples = stats.get('samples', 0)
        wins = stats.get('win', 0)
        if samples < 10:
            return 0.0025, "SCOUT (LOW SAMPLES)", "NORMAL"
        total_session_samples = sum(
            item.get('samples', 0) for vid, item in self.truth_vault.items()
            if current_session in vid
        )
        total_session_samples = max(total_session_samples, 1)
        win_rate = wins / samples
        frequency = samples / total_session_samples
        scarcity_score = 1 / (frequency ** 0.5) if frequency > 0 else 1
        if win_rate < 0.40:
            return 0.0, "VETO (DEATH ZONE)", "DEATH"
        risk_factor = (win_rate ** 2) * np.log1p(scarcity_score)
        final_risk = np.clip(self.BASE_RISK * risk_factor, 0.005, self.MAX_RISK_CAP)
        category = "GRIND"
        if final_risk > 0.015:
            category = "DIAMOND"
        elif final_risk > 0.008:
            category = "ALPHA"
        return round(final_risk, 4), f"{category} ({current_session})", category

    def adjudicate_survival(self, context):
        penalty = 0
        if context['gravity'] == "PANIC":
            return float('inf'), 0.0, "VETO PANIC"
        if context['session'] == "ASIA":
            penalty += 1
        risk, reason, category = self.calculate_market_brain_risk(context)
        if risk == 0.0:
            penalty += 2
        return penalty, risk, reason, category

    def ooda_process(self, current_price, alt_df):
        if not self.is_holding:
            return
        pos = self.current_position
        category = pos.get('category', 'GRIND')
        pnl_pct = (current_price - pos['entry']) / pos['entry'] if pos['side'] == "BUY" else (pos['entry'] - current_price) / pos['entry']
        trailing_mult = 2.5 if category == "DIAMOND" else 1.5
        if pnl_pct > (self.OODA_BRAKE_R * 0.01):
            atr_val = (alt_df['atr_pct'].iloc[-1] / 100) * current_price
            new_sl = current_price - (atr_val * trailing_mult) if pos['side'] == "BUY" else current_price + (atr_val * trailing_mult)
            pos['sl'] = max(pos['sl'], new_sl) if pos['side'] == "BUY" else min(pos['sl'], new_sl)

    def run_phase2_extraction(self, btc_history_df, alt_history_df):
        print(f"[PHASE 2] Tr\u00EDch xu\u1EA5t th\u1EF1c t\u1EA1i l\u1ECBch s\u1EED...")
        count = 0
        for i in range(20, len(alt_history_df) - 10):
            if alt_history_df.iloc[i]['close'] > alt_history_df.iloc[i]['open']:
                ctx = self.get_context_vector(btc_history_df.iloc[i], alt_history_df.iloc[i], alt_history_df.index[i])
                v_id = self.generate_vector_id(ctx)
                future_window = alt_history_df.iloc[i:i+10]
                entry = alt_history_df.iloc[i]['close']
                result = "WIN" if future_window['high'].max() > entry * 1.02 else "LOSS" if future_window['low'].min() < entry * 0.99 else "NOISE"
                if result != "NOISE":
                    record = self.truth_vault.setdefault(
                        v_id,
                        {"win": 0, "loss": 0, "samples": 0, "last_updated": self._iso_now()},
                    )
                    record["samples"] += 1
                    if result == "WIN":
                        record["win"] += 1
                    else:
                        record["loss"] += 1
                    record["last_updated"] = self._iso_now()
                    count += 1
        self._save_vault()
        print(f"[PHASE 2] \u0110\u00E3 v\u1EAFt {count} m\u1EABu b\u1ED1i c\u1EA3nh th\u1EF1c t\u1EBF.")

    def execute_trade(self, symbol, price, context, risk_pct, reason, category):
        risk_amount = self.CAPITAL * risk_pct
        self.is_holding = True
        self.current_position = {
            "symbol": symbol, "entry": price, "side": "BUY",
            "sl": price * 0.99, "tp": price * 1.03,
            "category": category, "risk": risk_pct
        }
        print(f"[ORDER] {symbol} @ {price} | Risk: {risk_pct*100:.2f}% | {reason}")


def prepare_data(df):
    df['atr_pct'] = ((df['high'] - df['low']).rolling(14).mean() / df['close']) * 100
    df['vol_ma'] = df['volume'].rolling(20).mean()
    return df.dropna()


if __name__ == "__main__":
    kernel = APO_Monolith_System()
    print(f"APO MONOLITH 1.1 KICH HOAT. MUC TIEU: CHINH PHUC THUC TAI.")
