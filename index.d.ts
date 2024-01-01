import type Shell from "@girs/shell-13";
import type {imports} from "@girs/gjs"

declare global {
    /**
     * Global shell object created by GNOME Shell on startup.
     *
     * @see https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/8a8539ee6766058b39d0a5c0961a08f76799f4da/js/ui/environment.js#L253
     */
    const global: Shell.Global;
}

// Gnome shell monkey-patches format into `String` which is the recommended way to use formatting for translatable strings.
// See https://gjs.guide/extensions/development/translations.html#marking-strings-for-translation
interface String {
    /**
     * Format this string with the given `args`.
     *
     * @see https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/8a8539ee6766058b39d0a5c0961a08f76799f4da/js/ui/environment.js#L355
     * @param args
     */
    readonly format: typeof imports.format.format;
}

interface Math {
    /**
     * Returns {@link x} clamped to the inclusive range of {@link min} and {@link max}.
     *
     * @see https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/8a8539ee6766058b39d0a5c0961a08f76799f4da/js/ui/environment.js#L357
     * @param x The value to be clamped.
     * @param min The lower bound of the result.
     * @param max The upper bound of the result.
     */
    clamp(x: number, min: number, max: number): number;
}
