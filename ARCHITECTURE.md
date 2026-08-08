Architecture

Overview

Engineering Troubleshooter is a Telegram-based diagnostic assistant. The system receives a user's message, processes the described symptoms, determines relevant diagnostic information, and generates a structured response.

System flow

Telegram User
      ↓
Telegram Bot API
      ↓
Cloudflare Worker
      ↓
Message Processing
      ↓
Diagnostic Logic
      ↓
Fault Database
      ↓
Generated Response
      ↓
Telegram User

Components

Telegram Bot

Provides the user interface and receives messages through the Telegram Bot API.

Cloudflare Worker

Acts as the backend of the application. It receives Telegram updates, processes messages, and sends responses back to Telegram.

Diagnostic Logic

Processes the user's description and connects symptoms with possible mechanical faults.

Fault Database

Contains structured information about mechanical problems, including symptoms, possible causes, and recommended checks.

Conversation Context

The bot can use previous messages from the conversation to make the diagnostic process more consistent and allow follow-up questions.

Diagnostic process

The diagnostic process follows a structured approach:

1. Receive the user's description.
2. Identify relevant symptoms.
3. Determine what additional information is needed.
4. Ask clarifying questions.
5. Compare the collected symptoms with known failure modes.
6. Suggest possible causes.
7. Recommend diagnostic checks.
8. Explain the engineering reasoning.

Design goals

The main design goals are:

- Keep the diagnostic process understandable.
- Separate user interaction from diagnostic logic.
- Make the fault database easy to expand.
- Keep the system lightweight enough to run as a serverless application.
- Provide explanations instead of only giving a final answer.
