import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_e2e_test():
    print("--- Starting Prompt-to-Notes E2E Pipeline Integration Test ---")
    
    # 1. Register a fresh test account
    email = f"test_student_{int(time.time())}@studyai.com"
    password = "password123"
    full_name = "E2E Tester Student"
    
    reg_url = f"{BASE_URL}/api/auth/register"
    reg_payload = {"email": email, "password": password, "full_name": full_name}
    
    print(f"Registering user: {email}...")
    reg_resp = requests.post(reg_url, json=reg_payload)
    if reg_resp.status_code == 201:
        print("Registration: SUCCESS")
    else:
        print(f"Registration FAILED: {reg_resp.status_code} - {reg_resp.text}")
        return
        
    # 2. Login to retrieve bearer token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {"email": email, "password": password}
    
    print("Logging in...")
    login_resp = requests.post(login_url, json=login_payload)
    if login_resp.status_code == 200:
        token = login_resp.json().get("access_token")
        print("Login: SUCCESS. Token retrieved.")
    else:
        print(f"Login FAILED: {login_resp.status_code} - {login_resp.text}")
        return
        
    # 3. Call Prompt-to-Notes generate endpoint
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    generate_url = f"{BASE_URL}/api/v1/notes/generate"
    generate_payload = {
        "prompt": "Operating Systems Virtual Memory and Page Replacement Algorithms",
        "generation_mode": "exam",
        "note_length": "medium",
        "language": "en"
    }
    
    print("Triggering Prompt-to-Notes generation pipeline (this might take a few seconds)...")
    gen_start = time.time()
    gen_resp = requests.post(generate_url, json=generate_payload, headers=headers)
    gen_duration = time.time() - gen_start
    
    if gen_resp.status_code == 200:
        note_data = gen_resp.json()
        print(f"Pipeline Generation: SUCCESS (took {gen_duration:.2f} seconds)")
        print(f"Notebook Title: '{note_data.get('title')}'")
        print(f"Content Length: {len(note_data.get('content'))} characters")
        print(f"Topics: {note_data.get('topics')}")
        print(f"Note ID: {note_data.get('id')}")
        
        # 4. Check if flashcards and quizzes were pre-compiled successfully
        cards_url = f"{BASE_URL}/api/study/flashcards/{note_data.get('id')}?difficulty=medium"
        cards_resp = requests.get(cards_url, headers=headers)
        if cards_resp.status_code == 200:
            cards = cards_resp.json()
            print(f"Pre-compiled Flashcards: SUCCESS (Found {len(cards)} cards)")
        else:
            print(f"Pre-compiled Flashcards: FAILED {cards_resp.status_code}")
            
        quiz_url = f"{BASE_URL}/api/study/quizzes/{note_data.get('id')}?difficulty=medium"
        quiz_resp = requests.get(quiz_url, headers=headers)
        if quiz_resp.status_code == 200:
            quiz = quiz_resp.json()
            print(f"Pre-compiled Quiz: SUCCESS (Found {len(quiz.get('questions', []))} questions)")
        else:
            print(f"Pre-compiled Quiz: FAILED {quiz_resp.status_code}")
            
    else:
        print(f"Pipeline Generation FAILED: {gen_resp.status_code} - {gen_resp.text}")

if __name__ == "__main__":
    run_e2e_test()
