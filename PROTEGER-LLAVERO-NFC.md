# Proteger con contraseña la URL del llavero NFC

Un llavero NFC sin protección se puede reescribir con cualquier teléfono y una
app gratuita, en tres segundos y sin dejar rastro. En un llavero de cobro eso es
grave: quien lo reescriba deja el llavero apuntando a otra página, con otra
cuenta bancaria, y el cliente sigue creyendo que es la suya.

Los chips NTAG traen una contraseña de fábrica que resuelve justo eso: bloquea
la escritura, deja la lectura libre y **se puede quitar después** para grabar
otra URL. Esta guía es el procedimiento completo: ponerla, comprobarla, quitarla
cuando haya que cambiar la URL y qué hacer si se pierde.

## Contraseña no es lo mismo que bloquear

Las apps de NFC ofrecen dos cosas parecidas que no lo son:

| Opción en la app | Qué hace | ¿Se puede deshacer? |
| --- | --- | --- |
| **Establecer una contraseña** (*Set password*) | Escribir en el chip pide la contraseña. Leer sigue siendo libre. | Sí, con la misma contraseña. |
| **Bloquear la etiqueta** (*Lock tag*) | El chip queda de solo lectura. | **No. Nunca.** Es un fusible físico. |

En un llavero de cliente va siempre la contraseña. El bloqueo permanente deja el
llavero inservible el día que haya que corregir la URL, y ese día llega:
GitHub Pages cambia de nombre, el cliente cambia de dominio, se detecta un error
de tipeo en el enlace.

## Qué protege y qué no

Protege lo que importa: nadie reescribe la URL de ese llavero sin la contraseña.

No hace estas otras cosas, y conviene tenerlo claro:

- **No esconde la página.** La lectura queda abierta a propósito. El llavero
  tiene que abrir la página al acercarlo a cualquier teléfono; si además se
  protegiera la lectura, dejaría de funcionar para lo único que sirve.
- **No impide copiar el contenido a otro chip.** Alguien puede leer la URL y
  grabarla en un llavero suyo. Lo que se evita es que manipulen *este* llavero,
  que es el que el cliente tiene en la mano y reconoce como confiable.
- **No es criptografía seria.** La contraseña del chip son 4 bytes. Frena a
  cualquiera con un teléfono y una app, que es el escenario real, no a alguien
  con lector especializado y ganas.

## Antes de empezar: confirmar el chip

La contraseña existe en los chips **NTAG213, NTAG215 y NTAG216** y en los
Mifare Ultralight EV1. Es lo que trae casi cualquier llavero o tarjeta que se
compre hoy, pero conviene confirmarlo antes de prometerlo.

Con **NFC Tools**, pestaña **Leer**, al acercar el llavero aparece el tipo de
chip y la memoria disponible (por ejemplo, `NTAG213`, 144 bytes). Si aparece
otro chip, la app va a decir que la operación no está soportada y no hay
contraseña posible: se cambia el llavero por uno NTAG.

Ojo con los llaveros muy baratos vendidos como NTAG215: algunos clones no
implementan la contraseña aunque se anuncien como compatibles. Si es un lote
nuevo, se prueba con una unidad antes de preparar las demás.

## Poner la contraseña

Se hace con **NFC Tools** (wakdev), gratis en Android. Es el último paso de la
preparación del llavero: primero se graba la URL definitiva y se comprueba que
abre bien, porque después habrá que quitar la contraseña para corregirla.

1. Grabar la URL en el llavero y probarla acercando el teléfono.
2. En NFC Tools, ir a **Otros** (*Other*) → **Establecer una contraseña**
   (*Set password*).
3. Escribir la contraseña y tocar **Validar**.
4. Acercar el llavero y esperar a que confirme la escritura.
5. Anotar la contraseña en el gestor de contraseñas, junto con el cliente y la
   URL grabada.

En iPhone la app tiene las mismas opciones en versiones recientes, pero la
escritura NFC en iOS es más caprichosa. Si la operación falla o no aparece el
menú, se hace con un Android: el resultado queda igual en el chip, no depende
del teléfono que lo escribió.

## Comprobar que quedó protegido

Este paso no se salta. Que la app diga "escritura completada" no confirma que la
protección esté activa sobre los datos.

1. **Leer**: acercar el teléfono. La página tiene que abrir como siempre.
2. **Intentar escribir**: desde otro teléfono, con NFC Tools, escribir cualquier
   URL de prueba en el llavero. Tiene que fallar con un error de escritura o de
   etiqueta protegida.

Si la escritura de prueba funciona, el llavero **no** está protegido: se repite
el procedimiento y se vuelve a comprobar.

## Cambiar la URL más adelante

Son tres pasos y el que se olvida siempre es el tercero.

1. **Otros** → **Eliminar la contraseña** (*Remove a password*), escribir la
   contraseña actual, validar y acercar el llavero.
2. **Escribir** la URL nueva.
3. **Volver a poner la contraseña.** Al quitarla, el llavero queda abierto a
   cualquiera hasta que se vuelva a proteger.

Conviene comprobar de nuevo con la escritura de prueba antes de devolver el
llavero.

## Elegir y guardar las contraseñas

Una contraseña por cliente, la misma para todos los llaveros de ese cliente. Así
un lote se prepara de corrido y, si una contraseña se filtra, no arrastra a los
demás clientes.

Van en el gestor de contraseñas, con el nombre del cliente y la URL grabada.
**Nunca en el repositorio**, ni en los comentarios de `index.html`, ni en el
mensaje de un commit: el repositorio es público y una contraseña ahí no sirve
de nada.

## Si se pierde la contraseña

El llavero no se puede reescribir nunca más. Quedan dos salidas y ninguna es
urgente si la URL está bien elegida:

- **Cambiar el contenido, no la URL.** Lo que se corrige (una cuenta, un correo,
  un banco) se edita en `index.html` y se publica. El llavero sigue apuntando al
  mismo enlace y no hay que tocarlo.
- **Reemplazar el llavero**, solo si de verdad hay que cambiar la dirección.

De ahí la regla de fondo: **la URL grabada tiene que ser estable**. Con la
página publicada en GitHub Pages en el repositorio del cliente, la dirección no
cambia nunca y quitar la contraseña deja de ser algo que haga falta.

Hay un rescate parcial si se recuerda la contraseña pero NFC Tools no la acepta.
NFC Tools no guarda el texto en el chip: usa los primeros 4 bytes del MD5 de lo
que se escribió. **NXP TagWriter** pide esa misma contraseña en hexadecimal, así
que se puede calcular y usar la otra app:

```bash
printf %s 'la-contrasena' | md5sum
```

Los primeros 8 caracteres del resultado son la contraseña (PWD) que espera
TagWriter; los 4 siguientes son el PACK. Al revés no funciona: del hexadecimal
no se recupera el texto original.

## Lo que no hay que tocar

Fuera de "establecer" y "eliminar" la contraseña, las apps de NFC ofrecen
opciones que dejan el llavero inservible sin aviso claro:

- **Bloquear la etiqueta / Lock tag / Solo lectura**: irreversible.
- **CFGLCK**, en apps de bajo nivel: congela la configuración del chip para
  siempre; la contraseña queda puesta y ya no se puede quitar.
- **PROT = 1** (proteger también la lectura): el llavero deja de abrir la
  página. NFC Tools no lo ofrece, pero otras apps sí.
- **AUTHLIM**: limita los intentos de contraseña y, agotados, cierra el acceso
  de forma definitiva.

## Checklist antes de entregar el llavero

- La URL definitiva está grabada y abre bien desde un teléfono.
- La contraseña está puesta y anotada en el gestor, con el cliente y la URL.
- Un segundo teléfono intentó escribir y fue rechazado.
- El llavero sigue leyéndose: la página abre al acercarlo.
