import { motion } from "framer-motion";
import AimenSignature from "@/assets/AimenSignature.png";
export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="border-t border-border bg-background py-12"
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl text-foreground">
              <span className="text-primary">Stahl</span> Tech
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Handcrafted excellence since 1987. Each whip is a testament to
              traditional craftsmanship and uncompromising quality.
            </p>
          </div>

          {/* Collections */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium uppercase tracking-wider text-foreground">
              Collections
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Bullwhips
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Snake Whips
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Stock Whips
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Signal Whips
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium uppercase tracking-wider text-foreground">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Our Story
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Craftsmanship
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Materials
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium uppercase tracking-wider text-foreground">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Care Guide
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Warranty
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Returns
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2024 Stahl Tech Leather Whips. All rights reserved.
          </p>
          <div className="flex gap-1">
            <a
              href="#"
              className="text-xs m-3 text-muted-foreground transition-colors hover:text-primary"
            >
              Developed By.
            </a>
            <a
              href="https://aimenansari.site/"
              className="group block transition-opacity hover:opacity-80"
            >
              <img
                src="/src/assets/AimenSignature.png"
                alt="Aimen Ansari Signature"
                className="h-10 w-auto object-contain brightness-110 contrast-125 filter"
              />
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
