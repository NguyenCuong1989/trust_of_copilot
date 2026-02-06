#!/usr/bin/env python3
"""
AI Partner - A simple AI copilot implementation focused on trust and collaboration.

This module implements a basic AI partner that can assist with various tasks
while maintaining transparency and building trust through clear communication.
"""

import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class PartnerInteraction:
    """Represents a single interaction with the AI partner."""
    timestamp: str
    user_input: str
    partner_response: str
    confidence: float
    context: Dict[str, Any]


class AIPartner:
    """
    A simple AI partner implementation focused on trust and transparency.
    
    This class provides a framework for building trust with users through
    clear communication, confidence indicators, and interaction history.
    """
    
    def __init__(self, name: str = "Copilot", personality: str = "helpful"):
        """
        Initialize the AI partner.
        
        Args:
            name: The name of the AI partner
            personality: The personality type (helpful, analytical, creative)
        """
        self.name = name
        self.personality = personality
        self.interaction_history: List[PartnerInteraction] = []
        self.trust_score = 0.5  # Start with neutral trust
        self.capabilities = {
            "text_analysis": True,
            "task_assistance": True,
            "code_review": True,
            "creative_writing": True
        }
    
    def respond(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a response to user input with transparency about confidence.
        
        Args:
            user_input: The user's input message
            context: Optional context for the interaction
            
        Returns:
            The AI partner's response
        """
        if context is None:
            context = {}
        
        # Simple response generation based on input patterns
        response, confidence = self._generate_response(user_input)
        
        # Record the interaction
        interaction = PartnerInteraction(
            timestamp=datetime.now().isoformat(),
            user_input=user_input,
            partner_response=response,
            confidence=confidence,
            context=context
        )
        self.interaction_history.append(interaction)
        
        # Update trust score based on interaction quality
        self._update_trust_score(confidence)
        
        return self._format_response(response, confidence)
    
    def _generate_response(self, user_input: str) -> tuple[str, float]:
        """
        Generate a response and confidence score.
        
        Args:
            user_input: The user's input
            
        Returns:
            Tuple of (response, confidence_score)
        """
        user_lower = user_input.lower()
        
        # Partnership and collaboration responses
        if any(word in user_lower for word in ["partner", "help", "assist", "collaborate"]):
            return (
                f"I'm here as your {self.personality} partner! I'm designed to work "
                f"alongside you with transparency. What would you like to work on together?",
                0.9
            )
        
        # Trust-related responses
        if any(word in user_lower for word in ["trust", "confidence", "reliable"]):
            return (
                f"Trust is built through consistent, transparent interactions. "
                f"My current trust score is {self.trust_score:.2f}. I always try to "
                f"be clear about my confidence levels and limitations.",
                0.85
            )
        
        # Capability inquiries
        if any(word in user_lower for word in ["can you", "what can", "capabilities"]):
            caps = ", ".join([cap.replace("_", " ") for cap, enabled in self.capabilities.items() if enabled])
            return (
                f"I can help with: {caps}. I'm most effective when we work together "
                f"as partners rather than you simply directing me.",
                0.8
            )
        
        # General greeting
        if any(word in user_lower for word in ["hello", "hi", "hey", "greetings"]):
            return (
                f"Hello! I'm {self.name}, your AI partner. I'm here to collaborate "
                f"with you while being transparent about my capabilities and limitations.",
                0.95
            )
        
        # Default response for unclear input
        return (
            f"I want to help, but I'm not entirely sure what you're looking for. "
            f"Could you provide more context? As your partner, clear communication "
            f"helps us work together more effectively.",
            0.3
        )
    
    def _format_response(self, response: str, confidence: float) -> str:
        """
        Format the response with confidence indicator.
        
        Args:
            response: The base response
            confidence: Confidence score (0.0 to 1.0)
            
        Returns:
            Formatted response with confidence indicator
        """
        confidence_indicator = ""
        if confidence < 0.5:
            confidence_indicator = " [Low confidence - please clarify]"
        elif confidence < 0.7:
            confidence_indicator = " [Moderate confidence]"
        elif confidence >= 0.9:
            confidence_indicator = " [High confidence]"
        
        return f"{response}{confidence_indicator}"
    
    def _update_trust_score(self, confidence: float):
        """
        Update the trust score based on interaction quality.
        
        Args:
            confidence: The confidence score of the last interaction
        """
        # Trust score moves slowly towards the average confidence
        adjustment = (confidence - self.trust_score) * 0.1
        self.trust_score = max(0.0, min(1.0, self.trust_score + adjustment))
    
    def get_trust_report(self) -> Dict[str, Any]:
        """
        Get a report on the current trust level and interaction history.
        
        Returns:
            Dictionary containing trust metrics and history
        """
        if not self.interaction_history:
            return {
                "trust_score": self.trust_score,
                "total_interactions": 0,
                "average_confidence": 0.0,
                "partner_name": self.name
            }
        
        avg_confidence = sum(i.confidence for i in self.interaction_history) / len(self.interaction_history)
        
        return {
            "trust_score": round(self.trust_score, 3),
            "total_interactions": len(self.interaction_history),
            "average_confidence": round(avg_confidence, 3),
            "partner_name": self.name,
            "personality": self.personality,
            "recent_interactions": [
                {
                    "timestamp": i.timestamp,
                    "confidence": i.confidence,
                    "user_input": i.user_input[:50] + "..." if len(i.user_input) > 50 else i.user_input
                }
                for i in self.interaction_history[-5:]  # Last 5 interactions
            ]
        }
    
    def save_history(self, filepath: str):
        """
        Save interaction history to a JSON file.
        
        Args:
            filepath: Path to save the history file
        """
        data = {
            "partner_info": {
                "name": self.name,
                "personality": self.personality,
                "trust_score": self.trust_score,
                "capabilities": self.capabilities
            },
            "interactions": [asdict(interaction) for interaction in self.interaction_history]
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def load_history(self, filepath: str):
        """
        Load interaction history from a JSON file.
        
        Args:
            filepath: Path to the history file
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Restore partner info
            partner_info = data.get("partner_info", {})
            self.name = partner_info.get("name", self.name)
            self.personality = partner_info.get("personality", self.personality)
            self.trust_score = partner_info.get("trust_score", self.trust_score)
            self.capabilities = partner_info.get("capabilities", self.capabilities)
            
            # Restore interactions
            self.interaction_history = [
                PartnerInteraction(**interaction)
                for interaction in data.get("interactions", [])
            ]
        except (FileNotFoundError, json.JSONDecodeError):
            # If file doesn't exist or is invalid, start fresh
            pass


def main():
    """
    Simple CLI interface for interacting with the AI partner.
    """
    print("=== AI Partner - Trust-focused Copilot ===")
    print("Type 'exit' to quit, 'trust' to see trust report, 'save' to save history")
    print()
    
    partner = AIPartner("My Partner", "helpful")
    
    # Try to load existing history
    partner.load_history("partner_history.json")
    
    while True:
        try:
            user_input = input("You: ").strip()
            
            if user_input.lower() == 'exit':
                break
            elif user_input.lower() == 'trust':
                report = partner.get_trust_report()
                print(f"\n=== Trust Report ===")
                print(f"Partner: {report['partner_name']}")
                print(f"Trust Score: {report['trust_score']}/1.0")
                print(f"Total Interactions: {report['total_interactions']}")
                print(f"Average Confidence: {report['average_confidence']}")
                print()
                continue
            elif user_input.lower() == 'save':
                partner.save_history("partner_history.json")
                print("History saved to partner_history.json")
                continue
            elif not user_input:
                continue
            
            response = partner.respond(user_input)
            print(f"{partner.name}: {response}")
            print()
            
        except KeyboardInterrupt:
            break
    
    # Auto-save on exit
    partner.save_history("partner_history.json")
    print(f"\nGoodbye! History saved. Final trust score: {partner.trust_score:.3f}")


if __name__ == "__main__":
    main()