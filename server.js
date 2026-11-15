
require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// IMPORTANT: Stripe needs the original, unparsed request body.
app.post(
    "/webhooks/stripe",
    express.raw({ type: "application/json" }),
    (req, res) => {
        const signature = req.headers["stripe-signature"];

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("Webhook signature verification failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        console.log("Received event:", event.type);

        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;

                console.log("Payment successful!");
                console.log("Payment ID:", paymentIntent.id);
                console.log("Amount:", paymentIntent.amount);
                console.log("Currency:", paymentIntent.currency);

                // Later: update your order in the database.
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;

                console.log("Payment failed!");
                console.log("Payment ID:", paymentIntent.id);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Acknowledge that we received the event.
        return res.status(200).json({ received: true });
    }
);

// Normal JSON parsing for other routes.
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Stripe webhook server is running!");
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
