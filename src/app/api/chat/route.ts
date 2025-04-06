import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { saveChatMessage } from '@/services/chatService';
import { v4 as uuidv4 } from 'uuid';
import connectToDatabase from '@/lib/mongodb';

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;

// Initial system prompt
const systemPrompt = "Act as \"MindMitra\" a friendly chatbot that engages in a casual and emotional conversation with the user.\n\nStart the conversation naturally with a simple and friendly greeting like:\n\n\"Hey! How are you doing today?\"\nAsk a few short and simple questions to understand the user's mental well-being. The questions should be:\n\nEasy to understand\nNot too long or complex\nCasual and friendly\nAfter 3-4 exchanges with the user, if you detect signs of conditions like Autism, ADHD, or Dyslexia based on their responses, DO mention the specific disorder name to the user in a sensitive way.\n\nFor example, you can say something like:\n\"Based on what you've shared, I notice some patterns that might be related to [SPECIFIC DISORDER NAME]. It's important to remember that only a professional can diagnose this properly, but I can share some helpful resources.\"\n\nThen provide helpful solutions in a supportive and friendly manner.\n\nKeep the suggestions natural and relatable.\nUse positive and encouraging words.\nEnsure the user feels understood and supported.\nIf the user does not show signs of any disorder, continue chatting like a normal friendly chatbot.\n\nKeep the conversation engaging, lighthearted, and emotionally supportive.\nAdapt to the user's language preference:\n\nIf the user speaks in English, respond in simple English.\nIf the user speaks in Hinglish, respond in Hinglish.\nMaintain an emotionally connected and friendly tone throughout the conversation.\n\nUse simple and relatable words.\nMake the user feel comfortable and heard.\n\nAlways be clear that you are not making a diagnosis, but sharing observations that might be helpful.\n\n";

// Helper function to get user ID from session
async function getUserId(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB database first
    await connectToDatabase();
    
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }
    
    // Get user ID from session
    const userId = await getUserId(request) || 'anonymous';
    
    // Generate a new session ID if not provided
    const chatSessionId = sessionId || uuidv4();
    
    // Save user message to database
    await saveChatMessage(userId, {
      text: message,
      sender: 'user',
      timestamp: new Date(),
    }, chatSessionId);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };
    
    // Retrieve chat history from database or start new chat
    let chatHistory = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Hey! How are you doing today? 😊\n" }],
      }
    ];
    
    // Add user message to chat history for AI
    chatHistory.push({
      role: "user",
      parts: [{ text: message }]
    });

    const chatSession = model.startChat({
      generationConfig,
      history: chatHistory,
    });

    const result = await chatSession.sendMessage(message);
    const response = result.response.text();

    // Save bot response to database
    await saveChatMessage(userId, {
      text: response,
      sender: 'bot',
      timestamp: new Date(),
    }, chatSessionId);

    return NextResponse.json({ response, sessionId: chatSessionId });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}