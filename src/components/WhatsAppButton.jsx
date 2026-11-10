import { motion } from 'framer-motion';

const WHATSAPP_NUMBER = '923338600603';
const WHATSAPP_MESSAGE = 'Hello StahlTech! I would like to inquire about your collection.';

export default function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with StahlTech on WhatsApp"
      title="Chat with us on WhatsApp: +92 333 8600603"
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition-colors hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-background md:bottom-8 md:right-8"
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 animate-ping rounded-full border-2 border-[#25D366]/40 motion-reduce:hidden"
      />

      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-7 w-7 fill-current"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.73.244-1.088 0-.058 0-.144-.03-.215-.1-.172-2.434-1.39-2.678-1.39zm-2.908 7.593c-1.747 0-3.48-.53-4.942-1.49L7.793 24.41l1.132-3.337a8.955 8.955 0 0 1-1.72-5.272c0-4.955 4.04-8.995 8.997-8.995a8.954 8.954 0 0 1 8.995 8.995 8.954 8.954 0 0 1-8.995 8.995zM19.11 2.86C10.42 2.86 3.35 9.93 3.35 18.62c0 1.94.42 3.79 1.17 5.47L2.86 29.14l5.19-1.63a15.66 15.66 0 0 0 8.06 2.23c8.69 0 15.76-7.07 15.76-15.76S27.8 2.86 19.11 2.86z" />
      </svg>

      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-sm border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg md:block md:translate-x-1 md:opacity-0 md:transition-all md:group-hover:translate-x-0 md:group-hover:opacity-100">
        Chat on WhatsApp
      </span>
    </motion.a>
  );
}
