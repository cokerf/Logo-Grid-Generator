import type {CustomizationOptions} from '../types';
import {defaultDrafting} from './drafting.ts';
export type LogoAppearance='outline'|'hatch'|'solid'|'original';
export function logoAppearance(c:CustomizationOptions):LogoAppearance{
 if(c.showFill&&c.useOriginalColors)return 'original';
 if(c.drafting?.hatch)return 'hatch';
 return c.showFill?'solid':'outline';
}
export function setLogoAppearance(c:CustomizationOptions,appearance:LogoAppearance):CustomizationOptions{
 return {...c,showFill:appearance==='solid'||appearance==='original',useOriginalColors:appearance==='original',drafting:{...(c.drafting||defaultDrafting),hatch:appearance==='hatch'}};
}
