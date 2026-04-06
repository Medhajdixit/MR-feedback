from openai import OpenAI
from dotenv import load_dotenv
import os



load_dotenv()  # loads .env file

client = OpenAI(api_key="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")

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say OK"}],
        max_tokens=5
    )
    print("✅ API key is working!")
    print(response.choices[0].message.content)

except Exception as e:
    print("❌ API key error:", e)
