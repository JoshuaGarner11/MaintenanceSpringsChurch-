// Prints a key pair for push notifications. Paste both lines into .env once; changing them later
// means everyone has to turn notifications on again.
import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}`);
