// Deliberately bounded: selecting a logo makes one detail request, never a search/random query.
export const logoCatalog = [
  {slug:'puma-logo',name:'Puma',kind:'Organic'},
  {slug:'bmw-logo',name:'BMW',kind:'Emblem'},
  {slug:'adidas',name:'Adidas',kind:'Geometric'},
  {slug:'apple-11',name:'Apple',kind:'Organic'},
  {slug:'nasa-6',name:'NASA',kind:'Emblem'},
  {slug:'chanel-2',name:'Chanel',kind:'Monogram'},
  {slug:'ethereum',name:'Ethereum',kind:'Geometric'},
  {slug:'slack-new-logo',name:'Slack',kind:'Modular'},
  {slug:'ford-8',name:'Ford',kind:'Lettering'},
  {slug:'the-north-face-1',name:'The North Face',kind:'Geometric'},
  {slug:'honda-11',name:'Honda',kind:'Monogram'},
  {slug:'python-5',name:'Python',kind:'Modular'},
] as const;
export const logoEndpoint='https://logo-grid-generator.netlify.app/.netlify/functions/worldvectorlogo';
