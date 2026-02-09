import { useState, useCallback, useRef } from "react";
import { useUserInfo } from "@/hooks/useUserInfo";

export type CheckoutStep =
    | "idle"
    | "name"
    | "email"
    | "address"
    | "phone"
    | "cardName"
    | "cardNumber"
    | "expiryDate"
    | "cvv"
    | "confirm"
    | "complete";

const STEP_ORDER: CheckoutStep[] = [
    "name",
    "email",
    "address",
    "phone",
    "cardName",
    "cardNumber",
    "expiryDate",
    "cvv",
    "confirm"
];

const STEP_PROMPTS: Record<CheckoutStep, string> = {
    idle: "",
    name: "Let's complete your order. What is your full name?",
    email: "Great! What is your email address?",
    address: "What is your shipping address?",
    phone: "What is your phone number?",
    cardName: "Now for payment details. What name is on your card?",
    cardNumber: "What is your card number?",
    expiryDate: "What is the expiry date? Please say it as month and year.",
    cvv: "What is the CVV or security code on the back of your card?",
    confirm: "I have all your details. Would you like me to place the order?",
    complete: "Your order has been placed successfully!"
};

export const useCheckoutFlow = () => {
    const [currentStep, setCurrentStep] = useState<CheckoutStep>("idle");
    const [collectedData, setCollectedData] = useState<Record<string, string>>({});
    const { updateUserInfo } = useUserInfo();
    const isFlowActiveRef = useRef(false);

    const startFlow = useCallback(() => {
        console.log("[CheckoutFlow] Starting guided checkout flow");
        setCurrentStep("name");
        setCollectedData({});
        isFlowActiveRef.current = true;
        return STEP_PROMPTS["name"];
    }, []);

    const stopFlow = useCallback(() => {
        console.log("[CheckoutFlow] Stopping checkout flow");
        setCurrentStep("idle");
        isFlowActiveRef.current = false;
    }, []);

    const getCurrentPrompt = useCallback(() => {
        return STEP_PROMPTS[currentStep];
    }, [currentStep]);

    const getNextStep = (current: CheckoutStep): CheckoutStep => {
        const currentIndex = STEP_ORDER.indexOf(current);
        if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
            return "complete";
        }
        return STEP_ORDER[currentIndex + 1];
    };

    const processAnswer = useCallback((transcript: string): {
        success: boolean;
        nextPrompt: string;
        shouldConfirmOrder?: boolean;
    } => {
        console.log("[CheckoutFlow] Processing answer for step:", currentStep, "transcript:", transcript);

        if (currentStep === "idle") {
            return { success: false, nextPrompt: "" };
        }

        // Handle confirmation step
        if (currentStep === "confirm") {
            const lowerTranscript = transcript.toLowerCase();
            if (lowerTranscript.includes("yes") || lowerTranscript.includes("place") ||
                lowerTranscript.includes("confirm") || lowerTranscript.includes("proceed")) {
                setCurrentStep("complete");
                isFlowActiveRef.current = false;
                return {
                    success: true,
                    nextPrompt: STEP_PROMPTS["complete"],
                    shouldConfirmOrder: true
                };
            } else if (lowerTranscript.includes("no") || lowerTranscript.includes("cancel")) {
                stopFlow();
                return { success: true, nextPrompt: "Order cancelled. Let me know if you need anything else." };
            }
            return { success: false, nextPrompt: "Please say yes to confirm or no to cancel." };
        }

        // Extract and validate data based on current step
        let extractedValue = transcript.trim();

        // Basic validation per step
        switch (currentStep) {
            case "email":
                // Simple email detection - look for @ symbol
                if (!extractedValue.includes("@")) {
                    // Try to construct email from spoken words
                    extractedValue = extractedValue
                        .replace(/\s+at\s+/gi, "@")
                        .replace(/\s+dot\s+/gi, ".")
                        .replace(/\s/g, "");
                }
                break;
            case "phone":
                // Extract numbers from spoken phone
                extractedValue = extractedValue.replace(/[^0-9]/g, "");
                if (extractedValue.length < 10) {
                    return { success: false, nextPrompt: "I didn't catch that. Please say your phone number again." };
                }
                break;
            case "cardNumber":
                // Extract card number digits
                extractedValue = extractedValue.replace(/[^0-9]/g, "");
                if (extractedValue.length < 13) {
                    return { success: false, nextPrompt: "I need the full card number. Please say all 16 digits." };
                }
                // Format with spaces
                extractedValue = extractedValue.match(/.{1,4}/g)?.join(" ") || extractedValue;
                break;
            case "expiryDate":
                // Extract expiry date - look for month and year
                const numbers = extractedValue.match(/\d+/g);
                if (numbers && numbers.length >= 2) {
                    const month = numbers[0].padStart(2, "0");
                    let year = numbers[1];
                    if (year.length === 4) year = year.slice(2);
                    extractedValue = `${month}/${year}`;
                }
                break;
            case "cvv":
                extractedValue = extractedValue.replace(/[^0-9]/g, "");
                if (extractedValue.length < 3) {
                    return { success: false, nextPrompt: "The CVV should be 3 or 4 digits. Please try again." };
                }
                break;
        }

        // Store the collected data
        const newData = { ...collectedData, [currentStep]: extractedValue };
        setCollectedData(newData);

        // Save to UserInfo context
        const fieldMapping: Record<string, string> = {
            name: "name",
            email: "email",
            address: "address",
            phone: "phone",
            cardName: "cardName",
            cardNumber: "cardNumber",
            expiryDate: "expiryDate",
            cvv: "cvv"
        };

        const userInfoField = fieldMapping[currentStep];
        if (userInfoField) {
            updateUserInfo({ [userInfoField]: extractedValue });

            // Dispatch event to update payment page form
            window.dispatchEvent(new CustomEvent("userInfoUpdated", {
                detail: {
                    message: `${currentStep} updated`,
                    updatedFields: [userInfoField]
                }
            }));
        }

        // Move to next step
        const nextStep = getNextStep(currentStep);
        setCurrentStep(nextStep);

        if (nextStep === "complete") {
            isFlowActiveRef.current = false;
        }

        const nextPrompt = STEP_PROMPTS[nextStep];
        console.log("[CheckoutFlow] Moving to next step:", nextStep, "prompt:", nextPrompt);

        return { success: true, nextPrompt };
    }, [currentStep, collectedData, updateUserInfo, stopFlow]);

    return {
        currentStep,
        isFlowActive: isFlowActiveRef.current || currentStep !== "idle",
        collectedData,
        startFlow,
        stopFlow,
        getCurrentPrompt,
        processAnswer
    };
};
