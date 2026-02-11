# Smooth Cart Voice

A voice-enabled e-commerce application designed to provide a seamless shopping experience using voice commands. Built with React, Vite, and Vapi.ai.

## Features

- **Voice-Powered Navigation & Shopping**: Use voice commands to browse categories, filter products, and add items to your cart using Vapi.ai and Gemini.
- **Dynamic Product Filtering**: Filter products by price, brand, and category through voice or UI.
- **Smart Cart Management**: Voice-controlled cart operations.
- **Modern UI/UX**: Built with Shadcn UI, Tailwind CSS, and Framer Motion for a smooth and responsive interface.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI
- **Voice AI**: Vapi.ai, Google Gemini AI
- **State Management**: React Context, TanStack Query
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Vapi.ai API Key and Assistant ID

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/ayushisingh0509/v-nova.git
    cd v-nova
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory and add your Vapi credentials:
    ```env
    VITE_VAPI_API_KEY=your_api_key_here
    VITE_VAPI_ASSISTANT_ID=your_assistant_id_here
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

## Usage

Click the microphone button in the bottom left corner to activate the voice assistant. You can say commands like:
- "Show me electronics"
- "Add headphones to cart"
- "Go to checkout"

## License

MIT
