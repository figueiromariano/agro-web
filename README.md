# Agro Web

Web app cliente para ver datos del proyecto Agro de monitoreo
agricola-ganadero en San Andres.

## Descripcion

Aplicacion web de solo lectura que muestra en tiempo real los datos
de los sensores del campo. Disenada para verse bien en celular.
Lee los datos directamente de Firebase Realtime Database.

## Funciones

- Ver temperatura y humedad (sensor DHT11)
- Ver presion atmosferica, temperatura y altitud (sensor BMP180)
- Ver estado del dispositivo (nombre, modo, red)
- Actualizacion automatica cada 30 segundos

## Tecnologias

- HTML, CSS, JavaScript puro (sin frameworks)
- Firebase Realtime Database
- Firebase Hosting

## Repositorios relacionados

- [campo-sensores](https://github.com/figueiromariano/campo-sensores)
- [agro-panel](https://github.com/figueiromariano/agro-panel)
- [agro-bot](https://github.com/figueiromariano/agro-bot)
- [agente-campo](https://github.com/figueiromariano/agente-campo)

## Desarrollo local

Clonar el repositorio:

    git clone https://github.com/figueiromariano/agro-web.git
    cd agro-web

Levantar servidor local (necesario por CORS):

    python3 -m http.server 8080

Abrir en el navegador:

    http://localhost:8080

## Despliegue

    firebase deploy --only hosting

## Proximos pasos

- App de administracion separada (agro-admin) con control de servicios
- Convertir en PWA instalable
- Agregar mas sensores a medida que se incorporen

## Estado

Funcionando en produccion
