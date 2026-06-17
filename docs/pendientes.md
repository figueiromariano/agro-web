
## PWA - ajuste visual en celular
- El contenido se ve correcto pero pequeño/compacto en la parte superior
- Cambios de CSS (tamanos de fuente, padding) no se reflejaron al probar
- Revisar: cache del service worker (puede estar sirviendo CSS viejo),
  forzar actualizacion del SW, o revisar si el manifest fuerza algun zoom
- Probar tambien sin modo PWA instalado, solo en el navegador del celular
