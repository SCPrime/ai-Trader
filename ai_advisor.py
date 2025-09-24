from dotenv import load_dotenv
load_dotenv()
import os
import anthropic

client = anthropic.Anthropic(
    api_key=os.getenv('ANTHROPIC_API_KEY')
)

def ask_claude_about_trade(symbol, price, action="buy"):
    prompt = f"""
    Analyze this potential trade:
    Symbol: {symbol}
    Current Price: ${price}
    Action: {action}
    
    Provide a brief assessment (2-3 sentences) of whether this seems 
    like a reasonable trade based on general market knowledge.
    Be concise and practical.
    """
    
    message = client.messages.create(
        model="claude-3-haiku-20240307",  # Cheaper, faster model
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return message.content[0].text

# Test it
symbol = "AAPL"
price = 230.50

print(f"Asking Claude about {symbol} at ${price}...")
print("-" * 50)
advice = ask_claude_about_trade(symbol, price)
print(advice)