import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig(({mode})=>({
  base:'./',
  plugins:[{
    name:'source-entry',
    configureServer(server) {
      server.middlewares.use((req,_res,next)=>{
        if(req.url==='/'||req.url==='/index.html')req.url='/app.html';
        next();
      });
    },
  },...(mode==='plugin'?[viteSingleFile()]:[])],
  build:{
    rollupOptions:{input:'app.html'},
    outDir:mode==='plugin'?'figma/dist':'dist',
    emptyOutDir:true,
  },
}));
