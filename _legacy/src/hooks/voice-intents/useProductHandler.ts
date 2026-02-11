import { products, Product } from "@/data/products";
import { prompts } from "@/lib/prompts";
import { useProduct } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";

// Shared Gemini utilities - will be imported from parent
type RunGeminiText = (prompt: string) => Promise<string>;
type ExtractJson = (text: string) => string;
type LogAction = (action: string, success?: boolean) => void;

interface UseProductHandlerProps {
    runGeminiText: RunGeminiText;
    extractJson: ExtractJson;
    logAction: LogAction;
}

export const getCurrentPageState = () => {
    const currentPath = window.location.pathname;
    // Manual params parsing for /product/:id
    let currentProductId = null;
    if (currentPath.startsWith("/product/")) {
        currentProductId = currentPath.split("/product/")[1];
    }

    let currentProduct: Product | null = null;
    if (currentProductId) {
        currentProduct = products.find(p => p.id === currentProductId) || null;
    }

    return {
        path: currentPath,
        currentProduct,
        isProductPage: currentPath.startsWith("/product/"),
        isCartPage: currentPath === "/cart",
        isPaymentPage: currentPath === "/payment",
    };
};

export const useProductHandler = ({
    runGeminiText,
    extractJson,
    logAction,
}: UseProductHandlerProps) => {
    const { setSelectedSize, setQuantity, selectedSize, quantity } = useProduct();
    const { addItem } = useCart();

    const handleProductActions = async (transcript: string) => {
        try {
            const pageState = getCurrentPageState();
            let currentProduct = pageState.currentProduct;
            let productName = currentProduct ? currentProduct.name : "current product";
            let productSizes = currentProduct ? currentProduct.sizes.join(", ") : "";

            console.log("[Voice Debug] Product Action Context:", { productName, productSizes, transcript });

            const prompt = prompts.productAction
                .replace("{productName}", productName)
                .replace("{sizes}", productSizes)
                .replace("{transcript}", transcript);

            const responseText = await runGeminiText(prompt);
            const cleaned = extractJson(responseText);
            const parsed = JSON.parse(cleaned);

            console.log("[Voice Debug] Parsed Product Action:", parsed);

            if (parsed.action === "none") {
                console.log("[Voice Debug] Action is 'none'");
                return false;
            }

            // Context switch check
            if (parsed.productName) {
                const targetProduct = products.find(p =>
                    p.name.toLowerCase().includes(parsed.productName.toLowerCase()) ||
                    parsed.productName.toLowerCase().includes(p.name.toLowerCase())
                );
                if (targetProduct) {
                    console.log("[Voice Debug] Switching context to product:", targetProduct.name);
                    currentProduct = targetProduct;
                }
            }

            if (!currentProduct) {
                console.log("[Voice Debug] No current product identified.");
                return false;
            }

            if (parsed.action === "size" && parsed.size) {
                const matchedSize = currentProduct.sizes.find(s => s.toLowerCase() === parsed.size.toLowerCase());
                if (matchedSize) {
                    setSelectedSize(matchedSize);
                    logAction(`Size set to ${matchedSize}`);
                    return true;
                }
                console.log("[Voice Debug] Size mismatch:", parsed.size, "Available:", currentProduct.sizes);
            }

            if (parsed.action === "quantity" && parsed.quantity) {
                setQuantity(parsed.quantity);
                logAction(`Quantity set to ${parsed.quantity}`);
                return true;
            }

            if (parsed.action === "addToCart") {
                console.log("[Voice Debug] Attempting Add to Cart...");

                // Priority for size: 1) size from voice command, 2) previously selected size, 3) ask user
                let sizeToAdd: string | null = null;

                // First: use the size Gemini extracted from voice (e.g. "add to cart in large")
                if (parsed.size) {
                    const matchedSize = currentProduct.sizes.find(
                        s => s.toLowerCase() === parsed.size.toLowerCase()
                    );
                    if (matchedSize) {
                        sizeToAdd = matchedSize;
                        setSelectedSize(matchedSize); // Also update the UI
                        console.log("[Voice Debug] Using voice-specified size:", matchedSize);
                    }
                }

                // Second: fall back to previously selected size from UI/voice
                if (!sizeToAdd && selectedSize) {
                    sizeToAdd = selectedSize;
                    console.log("[Voice Debug] Using previously selected size:", sizeToAdd);
                }

                // Third: if still no size, ask the user instead of auto-picking smallest
                if (!sizeToAdd) {
                    console.log("[Voice Debug] No size specified, asking user.");
                    logAction("Please select a size first. Available sizes: " + currentProduct.sizes.join(", "));
                    return true;
                }

                // Use quantity from voice command OR default to 1
                const quantityToAdd = parsed.quantity || 1;

                console.log("[Voice Debug] Adding to cart:", currentProduct.name, sizeToAdd, "qty:", quantityToAdd);
                addItem({
                    id: currentProduct.id,
                    name: currentProduct.name,
                    price: currentProduct.price,
                    image: currentProduct.image,
                    size: sizeToAdd,
                    quantity: quantityToAdd
                });
                logAction(`Added ${quantityToAdd} ${currentProduct.name} (${sizeToAdd}) to cart`);
                return true;
            }

            return true;
        } catch (error) {
            console.error("[Voice Debug] Product action error:", error);
            return false;
        }
    };

    return {
        handleProductActions,
        getCurrentPageState,
    };
};
