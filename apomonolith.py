import pandas as pd
import numpy as np
import json
import os
from datetime import datetime

class APO_Monolith_System:
    def __init__(self, initial_capital=859.92):
        self.CAPITAL = initial_capital
        self.BASE_RISK = 0.01
        self.MAX_RISK_CAP = 0.02
        self.SURVIVAL_THRESHOLD = 2
        self.OODA_BRAKE_R = 0.5
        self.truth_vault_path = "apo_truth_vault.json"
        self.truth_vault = self._load_vault()
        self.is_holding = False
        self.current_position = None

    def _load_vault(self):
        if os.path.exists(self.truth_vault_path):
            try:
                with open(self.truth_vault_path, 'r') as f:
                    return json.load(f)
            except: return {}
        return {}

    def _save_vault(self):
        with open(self.truth_vault_path, 'w') as f:
            json.dump(self.truth_vault, f, indent=2)

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
        if samples < 10: return 0.0025, "SCOUT (LOW SAMPLES)", "NORMAL"
        total_session_samples = sum(
            item.get('samples', 0) for vid, item in self.truth_vault.items()
            if current_session in vid
        )
        total_session_samples = max(total_session_samples, 1)
        win_rate = wins / samples
        frequency = samples / total_session_samples
        scarcity_score = 1 / (frequency ** 0.5) if frequency > 0 else 1
        if win_rate < 0.40: return 0.0, "VETO (DEATH ZONE)", "DEATH"
        risk_factor = (win_rate ** 2) * np.log1p(scarcity_score)
        final_risk = np.clip(self.BASE_RISK * risk_factor, 0.005, self.MAX_RISK_CAP)
        category = "GRIND"
        if final_risk > 0.015: category = "DIAMOND"
        elif final_risk > 0.008: category = "ALPHA"
        return round(final_risk, 4), f"{category} ({current_session})", category

    def adjudicate_survival(self, context):
        penalty = 0
        if context['gravity'] == "PANIC": return float('inf'), 0.0, "VETO PANIC"
        if context['session'] == "ASIA": penalty += 1
        risk, reason, category = self.calculate_market_brain_risk(context)
        if risk == 0.0: penalty += 2
        return penalty, risk, reason, category

    def ooda_process(self, current_price, alt_df):
        if not self.is_holding: return
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
                    if v_id not in self.truth_vault: self.truth_vault[v_id] = {"win": 0, "loss": 0, "samples": 0}
                    self.truth_vault[v_id]["samples"] += 1
                    if result == "WIN": self.truth_vault[v_id]["win"] += 1
                    else: self.truth_vault[v_id]["loss"] += 1
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
