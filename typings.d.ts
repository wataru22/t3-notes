import { type PassageElement, type PassageProfileElement } from '@passageidentity/passage-elements'
declare global {
    namespace JSX {
        interface IntrinsicElements {
            "passage-auth": PassageElement;
            "passage-login": PassageElement;
            "passage-register": PassageElement;
            "passage-profile": PassageProfileElement;
        }
    }
}