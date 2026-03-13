# \u03a3_AP\u03a9\u2082 CORE MODULE
# Authority: B\u1ed0 C\u01af\u1ed0NG Supreme System Commander
# Creator: alpha_prime_omega (4287)
# Status: CANONICAL

#!/usr/bin/env python3
"""
Example usage of the AI Partner system demonstrating trust-building interactions.
"""

from partner import AIPartner
import json
import time


def demonstrate_partner_interaction():
    """
    Demonstrate various types of interactions with the AI partner.
    """
    print("=== AI Partner Trust Demo ===")
    print("Demonstrating how trust builds through transparent interactions")
    print()
    
    # Create a partner instance
    partner = AIPartner("Demo Partner", "helpful")
    
    # Example interactions that would typically come from user input
    demo_interactions = [
        "Hello there!",
        "What are your capabilities?",
        "I need help with a project",
        "How can I trust you?",
        "Can you help me write some code?",
        "What's your confidence in that suggestion?",
        "Let's work together as partners"
    ]
    
    print("Running demo interactions...")
    print()
    
    for i, user_input in enumerate(demo_interactions, 1):
        print(f"Demo {i}:")
        print(f"User: {user_input}")
        
        # Get partner response
        response = partner.respond(user_input, {"demo_mode": True, "interaction_number": i})
        print(f"Partner: {response}")
        
        # Show trust score progression
        trust_report = partner.get_trust_report()
        print(f"Current Trust Score: {trust_report['trust_score']}")
        print("-" * 50)
        
        # Small delay for readability
        time.sleep(0.5)
    
    # Final trust report
    print("\n=== Final Trust Report ===")
    final_report = partner.get_trust_report()
    print(json.dumps(final_report, indent=2))
    
    # Save the demo history
    partner.save_history("demo_history.json")
    print("\nDemo complete! History saved to demo_history.json")


def interactive_partner_session():
    """
    Run an interactive session with the AI partner.
    """
    print("\n=== Interactive Partner Session ===")
    print("You can now chat with your AI partner!")
    print("Commands: 'trust' for trust report, 'exit' to quit")
    print()
    
    partner = AIPartner("Interactive Partner", "helpful")
    
    while True:
        try:
            user_input = input("You: ").strip()
            
            if user_input.lower() == 'exit':
                break
            elif user_input.lower() == 'trust':
                report = partner.get_trust_report()
                print(json.dumps(report, indent=2))
                continue
            elif not user_input:
                continue
            
            response = partner.respond(user_input)
            print(f"Partner: {response}")
            
        except KeyboardInterrupt:
            break
    
    print("Session ended. Thank you for working with your AI partner!")


if __name__ == "__main__":
    # Run the demonstration
    demonstrate_partner_interaction()
    
    # Ask if user wants to try interactive mode
    try:
        choice = input("\nWould you like to try interactive mode? (y/n): ").strip().lower()
        if choice == 'y' or choice == 'yes':
            interactive_partner_session()
    except KeyboardInterrupt:
        pass
    
    print("\nDemo complete!")