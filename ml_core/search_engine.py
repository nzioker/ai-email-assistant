# ml_core/search_engine.py
import json
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import os
import pickle

# Define file paths for persistence
INDEX_FILE = "email_index.faiss"
EMAIL_DATA_FILE = "email_data.pkl"

print("🚀 Initializing AI Email Search Engine...")

def load_or_create_index():
    """
    The CORE function.
    Loads existing index and email data, or creates them from scratch.
    Returns: (model, index, emails_df)
    """
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Model loaded.")

    # 1. CHECK FOR SAVED DATA
    if os.path.exists(INDEX_FILE) and os.path.exists(EMAIL_DATA_FILE):
        print("📂 Loading saved index and email data...")
        index = faiss.read_index(INDEX_FILE)
        with open(EMAIL_DATA_FILE, 'rb') as f:
            emails_df = pickle.load(f)
        print(f"   Loaded {index.ntotal} emails from cache.")
        return model, index, emails_df

    # 2. CREATE NEW DATA (Only runs if no saved files exist)
    print("📧 Creating new embeddings and index from dataset...")

    # TODO: REPLACE THIS BLOCK WITH CODE TO LOAD YOUR 'sample_emails.csv'
    sample_emails = [
        {"sender": "project@company.com", "subject": "Weekly Budget Update", "body": "The project budget is on track with last week's forecasts."},
        {"sender": "team@collab.com", "subject": "Meeting Notes", "body": "Action items: Alex to finalize the design mockups by Friday."},
        {"sender": "notification@system.com", "subject": "Your order confirmation #456", "body": "Thank you for your recent purchase."}
    ]
    emails_df = pd.DataFrame(sample_emails)
    # ---------------------------------------------------------------

    # Prepare text for embedding
    emails_df['search_text'] = emails_df['subject'] + " " + emails_df['body']
    email_texts = emails_df['search_text'].tolist()

    # Create embeddings and index
    email_embeddings = model.encode(email_texts, show_progress_bar=True)
    dimension = email_embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(email_embeddings.astype('float32'))

    # SAVE for future runs
    faiss.write_index(index, INDEX_FILE)
    with open(EMAIL_DATA_FILE, 'wb') as f:
        pickle.dump(emails_df, f)
    print(f"✅ New index built and saved with {index.ntotal} emails.")
    return model, index, emails_df


def search_emails(query, model, index, emails_df, top_k=3):
    """Takes a text query and returns the top_k most relevant emails."""
    # Encode the query
    query_embedding = model.encode([query])
    # Search the index
    distances, indices = index.search(query_embedding.astype('float32'), top_k)
    # Get results
    results = emails_df.iloc[indices[0]].copy()
    results['similarity_score'] = (1 / (1 + distances[0]))  # Simple distance-to-score
    return results


def read_user_query(query_file_path='data/user_query.txt'):
    """Reads the user's search query from a text file."""
    try:
        with open(query_file_path, 'r') as f:
            query = f.read().strip()
        if not query:
            print("⚠️  Query file is empty. Using default query.")
            return "budget update"
        return query
    except FileNotFoundError:
        print(f"⚠️  Query file '{query_file_path}' not found. Using default query.")
        return "budget update"

def write_search_results(results_df, output_file_path='data/search_results.json'):
    """Writes the search results DataFrame to a JSON file."""
    # Convert DataFrame to a list of dictionaries for JSON serialization
    results_list = results_df.to_dict(orient='records')
    
    # Create a directory for output if it doesn't exist
    os.makedirs(os.path.dirname(output_file_path), exist_ok=True)
    
    with open(output_file_path, 'w') as f:
        json.dump(results_list, f, indent=2)
    print(f"✅ Search results written to {output_file_path}")



# ==================== MAIN EXECUTION ====================
if __name__ == "__main__":
    # Load everything (model, index, data)
    model, index, emails_df = load_or_create_index()
    
    # 1. Read the user's query from file
    user_query = read_user_query()
    print(f"\n🔍 Processing query: '{user_query}'")
    
    # 2. Perform the search
    results = search_emails(user_query, model, index, emails_df, top_k=5)
    
    # 3. Write results to JSON file
    write_search_results(results)
    
    # 4. Also print to console for immediate feedback
    print("\n📨 Top matches:")
    print(results[['sender', 'subject', 'similarity_score']])