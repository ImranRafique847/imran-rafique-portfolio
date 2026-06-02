import urllib.request
import re

repos = [
    ("personal-ai-agent", "https://github.com/ImranRafique847/personal-ai-agent"),
    ("AI-Demaged-Car-Classifications", "https://github.com/ImranRafique847/AI-Demaged-Car-Classifications"),
    ("ai-shopping-assistant", "https://github.com/ImranRafique847/ai-shopping-assistant"),
    ("AI-Agent-for-Data-Visualization-", "https://github.com/ImranRafique847/AI-Agent-for-Data-Visualization-"),
    ("Flight-Booking-Conversational-Agent-Google-Cloud-Dialogflow-CX", "https://github.com/ImranRafique847/Flight-Booking-Conversational-Agent-Google-Cloud-Dialogflow-CX"),
    ("Health-Chatbot", "https://github.com/ImranRafique847/Health-Chatbot"),
    ("Research-Paper-Analyzer-Chatbot", "https://github.com/ImranRafique847/Research-Paper-Analyzer-Chatbot"),
    ("Car_Price_Prediction", "https://github.com/ImranRafique847/Car_Price_Prediction"),
    ("HR-Analysis", "https://github.com/ImranRafique847/HR-Analysis"),
    ("Flight-Passengers-Prediction-System", "https://github.com/ImranRafique847/Flight-Passengers-Prediction-System"),
    ("HR-Analytics", "https://github.com/ImranRafique847/HR-Analytics"),
]

user = "ImranRafique847"

for repo_name, repo_url in repos:
    readme_url = f"https://raw.githubusercontent.com/{user}/{repo_name}/main/README.md"
    try:
        req = urllib.request.Request(readme_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            
            # Extract tech keywords
            techs = set()
            keywords = ['python', 'tensorflow', 'pytorch', 'keras', 'pandas', 'scikit-learn', 
                       'numpy', 'flask', 'fastapi', 'django', 'aws', 'google cloud', 'azure',
                       'docker', 'kubernetes', 'aws', 'llm', 'nlp', 'rag', 'langchain', 
                       'openai', 'huggingface', 'bert', 'transformers', 'lstm', 'cnn',
                       'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
                       'jupyter', 'streamlit', 'plotly', 'matplotlib', 'seaborn',
                       'anthropic', 'claude', 'groq', 'ollama', 'chromadb', 'pinecone',
                       'dialogflow', 'rasa', 'spacy', 'nltk', 'cv2', 'opencv']
            
            content_lower = content.lower()
            for keyword in keywords:
                if keyword in content_lower:
                    techs.add(keyword.title())
            
            techs_str = '|'.join(sorted(techs))
            print(f"{repo_name}|{techs_str}")
    except Exception as e:
        print(f"{repo_name}|ERROR:{type(e).__name__}")
