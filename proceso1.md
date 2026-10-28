# Implementación de cuatro motores de bases de datos con Docker Compose

## Información del trabajo

**Estudiante:** Brayan David Arvealo Luna
**Docente:** Ing. Jaider Quintero M.
**Asignatura:** Base de Datos II
**Guía:** Oscar David Vega Daza

---

## 1. Descripción del proyecto

En este trabajo se realizó el montaje, configuración y puesta en funcionamiento de **cuatro motores de bases de datos** utilizando **Docker Compose** dentro de un entorno **WSL2 con Ubuntu**.

Los motores implementados fueron:

* MySQL 8.0
* PostgreSQL 17
* Microsoft SQL Server 2022
* Oracle Database 21c Express Edition

El objetivo principal fue desplegar los cuatro servicios de manera independiente, mantener sus datos mediante almacenamiento persistente y permitir su administración y conexión remota mediante **DBeaver**.

---

## 2. Entorno utilizado

* **Sistema:** Windows con WSL2
* **Distribución:** Ubuntu
* **Contenedores:** Docker
* **Orquestación:** Docker Compose
* **Herramienta de administración:** DBeaver 26.1.5
* **Red Docker:** `ia-lab-network`

La dirección IP utilizada para las conexiones desde DBeaver corresponde a la interfaz de red de WSL. Esta dirección puede cambiar al reiniciar WSL, por lo que debe verificarse nuevamente mediante:

```bash
ip a
```

---

## 3. Motores implementados

| Motor      | Versión | Contenedor        | Puerto | Base de datos / servicio |
| ---------- | ------- | ----------------- | -----: | ------------------------ |
| MySQL      | 8.0     | `mysql-server`    |   3306 | `mi_nueva_bd`            |
| PostgreSQL | 17      | `postgres-server` |   5432 | `nombre_bd`              |
| SQL Server | 2022    | `mssql-server`    |   1433 | `bd_clase1`              |
| Oracle XE  | 21c     | `oracle-server`   |   1521 | `tecnogua`               |

Las credenciales utilizadas durante las pruebas se encuentran documentadas en el informe completo y **no se incluyen en este README por seguridad**.

---

## 4. MySQL 8.0

Se implementó MySQL 8.0 mediante Docker Compose utilizando el contenedor:

```text
mysql-server
```

El servicio utiliza el puerto:

```text
3306
```

Se configuró almacenamiento persistente para conservar los datos y se habilitó la conexión desde otras máquinas mediante la configuración de red correspondiente.

Se creó la base de datos:

```text
mi_nueva_bd
```

También se creó un usuario de prueba con permisos sobre dicha base de datos.

La conexión remota fue comprobada mediante DBeaver.

---

## 5. PostgreSQL 17

Se implementó PostgreSQL 17 mediante Docker Compose utilizando el contenedor:

```text
postgres-server
```

El servicio utiliza el puerto:

```text
5432
```

Se configuró almacenamiento persistente y se habilitó PostgreSQL para aceptar conexiones mediante la red configurada.

Durante las pruebas se trabajó con las bases de datos:

```text
bd_clase1
nombre_bd
```

También se creó un usuario de prueba y se verificó el acceso mediante DBeaver.

---

## 6. Microsoft SQL Server 2022

Se implementó Microsoft SQL Server 2022 utilizando la imagen oficial:

```text
mcr.microsoft.com/mssql/server:2022-latest
```

El contenedor utilizado fue:

```text
mssql-server
```

El servicio utiliza el puerto:

```text
1433
```

Se verificó el funcionamiento del servidor y se instalaron las herramientas necesarias para realizar consultas mediante `sqlcmd`.

Durante las pruebas se creó la base de datos:

```text
bd_clase1
```

También se configuró un usuario para las pruebas de autenticación y se verificó la conexión desde DBeaver.

---

## 7. Oracle Database 21c XE

Se implementó Oracle Database 21c Express Edition utilizando la imagen:

```text
gvenzl/oracle-xe:21-slim
```

El contenedor utilizado fue:

```text
oracle-server
```

El servicio utiliza el puerto:

```text
1521
```

El Service Name utilizado para la conexión fue:

```text
tecnogua
```

Se creó el usuario de prueba `BRAYAN` y se verificó la conexión mediante SQL*Plus y DBeaver.

Durante la configuración inicial se presentó un problema con la inicialización del volumen de datos. Después de corregir la configuración, el contenedor quedó funcionando correctamente.

---

## 8. Docker Compose y persistencia

Cada motor fue configurado mediante un archivo `docker-compose.yml`.

Los servicios utilizan una red Docker compartida:

```text
ia-lab-network
```

También se configuraron volúmenes para conservar los datos de cada motor aunque los contenedores fueran detenidos o reiniciados.

La estructura general utilizada para los datos fue:

```text
~/ia-lab/data/
├── mysql/
├── postgres/
├── mssql/
└── oracle/
```

Los respaldos de las bases de datos también fueron generados durante el desarrollo del trabajo.

---

## 9. Conexiones mediante DBeaver

Una vez configurados los cuatro motores, se realizaron pruebas de conexión desde **DBeaver 26.1.5**.

Las conexiones verificadas fueron:

* MySQL → puerto `3306`
* PostgreSQL → puerto `5432`
* SQL Server → puerto `1433`
* Oracle → puerto `1521`

Con estas pruebas se comprobó que los cuatro motores estaban funcionando correctamente y podían ser administrados desde una herramienta gráfica externa.

---

## 10. Respaldos

Como parte de las pruebas se realizaron respaldos de las bases de datos utilizando las herramientas correspondientes a cada motor.

Se generaron archivos de respaldo para:

* MySQL → archivo `.sql`
* PostgreSQL → archivo `.sql`
* SQL Server → archivo `.bak`
* Oracle → archivo `.dmp`

Los archivos de respaldo fueron comprobados durante el desarrollo y se encuentran relacionados con las evidencias del proyecto.

---

## 11. Evidencias

Las evidencias del proceso se encuentran organizadas en la carpeta:

```text
evidencias/
```

La organización es la siguiente:

```text
evidencias/
├── 01-mysql/
├── 02-postgresql/
├── 03-sql-server/
└── 04-oracle/
```

Las capturas muestran principalmente:

* Configuración de los motores.
* Inicio de los contenedores.
* Estado de los servicios.
* Creación y consulta de bases de datos.
* Creación de usuarios.
* Realización de respaldos.
* Conexiones desde DBeaver.
* Solución de errores encontrados durante la implementación.

---

## 12. Documentación completa

Para consultar el procedimiento completo, los comandos utilizados, configuraciones, pruebas, errores encontrados y evidencias detalladas, se puede consultar:

[Documentación completa del proyecto](documentacion2.md)

---

## 13. Uso de Inteligencia Artificial

Durante el desarrollo de este trabajo se contó con el apoyo de **ChatGPT como herramienta de Inteligencia Artificial**.

La herramienta fue utilizada principalmente como apoyo para solucionar los diferentes errores que se presentaron durante el montaje y configuración de los motores de bases de datos.

Entre los problemas solucionados se encontraron situaciones como la ejecución de comandos fuera del motor correspondiente, errores de sintaxis, errores en comandos de configuración y dificultades durante la instalación y conexión de los diferentes servicios.

El uso de esta herramienta permitió identificar y corregir los problemas encontrados durante el proceso y, mediante este trabajo conjunto, lograr el **montaje y funcionamiento de los cuatro motores de bases de datos**.

---

## 14. Experiencia

La experiencia durante el desarrollo del trabajo fue **muy agradable y enriquecedora**, ya que permitió adquirir nuevos conocimientos relacionados con la instalación, configuración, administración y conexión de diferentes motores de bases de datos.

Además, la solución de los errores encontrados durante el proceso permitió comprender mejor el funcionamiento de Docker, WSL, Docker Compose y las herramientas de administración de bases de datos.

El proyecto permitió trabajar de manera práctica con cuatro motores diferentes y comprobar sus conexiones y funcionamiento mediante DBeaver.

---

## 15. Recomendaciones

* No publicar contraseñas ni credenciales reales en repositorios públicos.
* Verificar la dirección IP de WSL antes de realizar conexiones remotas.
* Mantener respaldos de las bases de datos.
* Utilizar usuarios con los permisos mínimos necesarios.
* Restringir los puertos de acceso cuando se trabaje fuera de un entorno de pruebas.
* Comprobar periódicamente que los respaldos puedan ser restaurados.

---

## 16. Fuentes consultadas

La documentación técnica utilizada para realizar la implementación se encuentra detallada en `documentacion2.md`, donde se incluyen las fuentes correspondientes a la instalación y configuración de MySQL, PostgreSQL, Microsoft SQL Server y Oracle Database.
