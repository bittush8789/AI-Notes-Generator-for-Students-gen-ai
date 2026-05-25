import os
import requests
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def transcribe_audio(filepath: str, language: str = "en") -> str:
    """
    Transcribes audio using Groq's whisper-large-v3 API.
    If GROQ_API_KEY is not configured, falls back to a high-quality mock lecture transcript.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Audio file not found: {filepath}")

    # Fallback to Demo Mode if key is missing
    if not GROQ_API_KEY:
        logger.info("GROQ_API_KEY is not configured. Returning rich mock lecture transcription...")
        filename = os.path.basename(filepath).lower()
        
        # Customize mock transcript based on file name if possible, otherwise provide standard high-quality academic transcript
        if "history" in filename:
            return (
                "Welcome back, everyone. Today, we're diving into the Industrial Revolution, "
                "a period of profound social and economic change that began in Great Britain in the late 18th century. "
                "Before this era, manufacturing was done in people's homes, using hand tools or basic machines. "
                "The Industrial Revolution marked a shift to powered, special-purpose machinery, factories and mass production. "
                "The iron and textile industries, along with the development of the steam engine, played central roles. "
                "In particular, James Watt's improvements to the steam engine in 1776 were monumental, "
                "allowing it to power machinery in factories, which previously had to rely on water power. "
                "This transformed transportation as well, leading to the steam locomotive and steamships. "
                "However, the rapid urbanization brought about by these factories led to grim living and working conditions "
                "for the working class, leading to the rise of early labor unions and calls for legislative reform."
            )
        elif "computer" in filename or "coding" in filename or "programming" in filename:
            return (
                "Hello everyone, let's get started. Today we are talking about Object-Oriented Programming, commonly called OOP. "
                "OOP is a fundamental programming paradigm based on the concept of 'objects', which can contain data and code. "
                "There are four major principles that define OOP: Inheritance, Polymorphism, Encapsulation, and Abstraction. "
                "Let's break these down. First, Encapsulation is the bundling of data and the methods that operate on that data "
                "into a single unit, a class. This hides the internal state of the object. "
                "Second, Abstraction means hiding complex implementation details and showing only the essential features. "
                "Third, Inheritance allows a new class, called a subclass, to adopt the attributes and methods of an existing "
                "class, called a superclass, promoting code reuse. "
                "And fourth, Polymorphism allows different classes to be treated as instances of the same superclass, "
                "enabling a single interface to represent different underlying forms, like a draw() method acting differently "
                "on a Circle versus a Square object. Understanding these four pillars is crucial for writing clean, scalable software."
            )
        else:
            return (
                "Good morning, class. Today we will discuss the fundamentals of Artificial Intelligence and Machine Learning. "
                "Artificial Intelligence refers to the broad concept of machines being able to carry out tasks in a smart way. "
                "Machine Learning, which is a subset of AI, is the idea that we can give machines access to data and let them "
                "learn for themselves without being explicitly programmed. "
                "At the core of modern machine learning are Neural Networks, which are computing systems vaguely inspired by the "
                "biological neural networks that constitute animal brains. "
                "A neural network is made up of layers of node, or 'neurons'. An input layer receives data, one or more hidden layers "
                "process it using mathematical weights, and an output layer makes the final prediction or decision. "
                "Deep Learning is simply a neural network with many hidden layers, typically more than three. "
                "The key challenge in training these systems is optimization—finding the right parameters to minimize error. "
                "We do this using an algorithm called Gradient Descent, where we iteratively adjust the weights "
                "in the direction of the steepest decrease of our loss function. This mathematical process is what we call 'learning'."
            )

    # Call Groq Whisper API
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    # Supported files: mp3, mp4, mpeg, mpga, m4a, wav, webm
    mime_type = "audio/mpeg"
    if filepath.endswith(".wav"):
        mime_type = "audio/wav"
    elif filepath.endswith(".m4a"):
        mime_type = "audio/mp4"

    try:
        logger.info(f"Sending audio file {filepath} to Groq Whisper API...")
        with open(filepath, "rb") as audio_file:
            files = {
                "file": (os.path.basename(filepath), audio_file, mime_type)
            }
            data = {
                "model": "whisper-large-v3",
                "response_format": "json"
            }
            if language:
                data["language"] = language

            response = requests.post(url, headers=headers, files=files, data=data, timeout=120)
            
            if response.status_code != 200:
                logger.error(f"Groq Whisper API returned error {response.status_code}: {response.text}")
                raise ValueError(f"Transcription failed: {response.text}")

            result = response.json()
            return result.get("text", "")
            
    except Exception as e:
        logger.error(f"Failed to transcribe audio via Groq: {str(e)}")
        raise ValueError(f"Transcription error: {str(e)}")
