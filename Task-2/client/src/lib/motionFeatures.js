// The Motion feature bundle, kept in its own file so <LazyMotion> can fetch
// it as a separate chunk after the page is already on screen.
//
// domMax (not the smaller domAnimation) because the app uses layout
// animations: the sliding nav underline, dock highlight, cart lines and toasts.
export { domMax as default } from 'motion/react';
