declare module 'http' {
    interface IncomingMessage {
        utils: {
            whatsApp: import('venom-bot').Whatsapp;
        };
    }
}
