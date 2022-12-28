/*
 * MMM-DolarArgentina
 * MIT License
 *
 * By Fabrizz <3
 */

Module.register("MMM-DolarArgentina", {
  /* Magic Mirror configuration */
  /** Requiered Magic Mirror version */
  requiresVersion: "2.12.0",
  defaults: {
    /** Module name */
    name: "MMM-DolarArgentina",
    /** API endpoint */
    url: "https://api.bluelytics.com.ar/v2/latest",
    /** Time between API calls, in seconds (12 hours default) */
    updateInterval: 43200,
    /** Fade In/Out speed */
    animationSpeed: 2500,
    /** Use themes bradcasted from other modules */
    useDynamicTheming: null,
    /** Currency types */
    types: ["oficial", "blue"],
  },

  /* Fetches the provided endpoint */
  getDolarExchange: function () {
    let t = this;
    fetch(this.config.url, {
      method: "GET",
      referrerPolicy: "no-referrer",
    })
      .then((data) =>
        data.json().then((payload) => t.setDolarExchange(payload)),
      )
      .catch((e) =>
        console.error(
          `[${this.name}] An error ocurred while accesing the api.`,
          e,
        ),
      );
  },

  /* Filters the received data and request a redraw */
  setDolarExchange: function (data) {
    if (!data) return;

    // https://www.dolarsi.com/api/api.php?type=valoresprincipales
    // La API de dolarsi dejó de actualizar valores en 2022.
    // Original by: https://github.com/consus2903
    // Dolarsi handler:
    if (this.config.url.includes("dolarsi.com")) {
      this.dolarTypes = data
        .filter((apiDolarType) =>
          this.config.types.some((type) =>
            apiDolarType.casa.nombre.toLowerCase().includes(type),
          ),
        )
        .map((apiDolarType) => ({
          purchase:
            apiDolarType.casa.compra !== "No Cotiza"
              ? this.getNumbers(apiDolarType.casa.compra)
              : ["--", "--"],
          sale: this.getNumbers(apiDolarType.casa.venta),
          name: apiDolarType.casa.nombre.replace("Dolar ", "").toUpperCase(),
        }));
    }

    // https://api.bluelytics.com.ar/v2/latest
    // Bluelytics handler:
    if (this.config.url.includes("bluelytics.com.ar")) {
      let dolarArray = [];
      this.config.types.forEach((name) => {
        let type = data[name];
        let currency = {
          name: name.replace("_", " ").toUpperCase(),
          purchase: type.value_buy
            ? this.getNumbers(type.value_buy)
            : ["--", "--"],
          sale: type.value_sell
            ? this.getNumbers(type.value_sell)
            : ["--", "--"],
        };
        dolarArray.push(currency);
      });
      this.dolarTypes = dolarArray;
    }

    this.loaded = true;
    this.updateDom(this.config.animationSpeed);
  },

  /* Dom Generation */
  getDom: function () {
    let wrapper = document.createElement("div");
    wrapper.classList.add("ca-wa");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading U$D exchange rates...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    this.dolarTypes.forEach((dolarType) => {
      // Container for dolar type
      let container = document.createElement("span");
      container.classList.add("ca-cnt");
      if (this.rtl) container.classList.add("rtl");

      // Dolar type name
      let designation = document.createElement("span");
      designation.classList.add("ca-cnt-dg");
      designation.innerHTML = dolarType.name;
      container.appendChild(designation);

      // Exchange rates
      let exchangeContainer = document.createElement("span");
      exchangeContainer.classList.add("ca-cnt-ex");

      let buy = document.createElement("span");
      buy.classList.add("ca-cnt-ex-txt");
      buy.innerHTML = `${dolarType.purchase[0]}<span>${dolarType.purchase[1]}</span>`;
      exchangeContainer.appendChild(buy);

      let sell = document.createElement("span");
      sell.innerHTML = `${dolarType.sale[0]}<span>${dolarType.sale[1]}</span>`;
      sell.classList.add("ca-cnt-ex-txt");

      exchangeContainer.appendChild(sell);
      container.appendChild(exchangeContainer);
      wrapper.appendChild(container);
    });

    return wrapper;
  },

  /* Startup / Schedule */
  start: function () {
    this.logBadge();
    this.rtl = false;
    this.loaded = false;
    this.enabled = true;
    this.getDolarExchange();

    if (this.config.useDynamicTheming)
      console.warn(
        `[${this.name}] "useThemeFrom" is not a feature enabled yet.`,
      );
    if (this.data.position.includes("rigth")) this.rtl = true;

    let t = this;
    if (this.config.updateInterval !== 0) {
      setInterval(function () {
        t.getDolarExchange();
      }, this.config.updateInterval * 1000);
    }
  },
  getStyles: function () {
    return ["MMM-DolarArgentina.css"];
  },

  /* Utils */
  getNumbers: function (str) {
    const strNumber =
      typeof str === "string"
        ? (Math.round(Number(str.replace(",", ".")) * 100) / 100)
            .toString()
            .replace(".", ",")
        : (Math.round(str * 100) / 100).toString().replace(".", ",");
    let [part1, part2 = "0"] = strNumber.split(",");
    part2 = part2.padEnd(2, "0");
    return [part1, part2];
  },
  logBadge: function () {
    console.log(
      `\n %c by Fabrizz %c ${this.name} %c \n`,
      "background-color: #555;color: #fff;padding: 3px 2px 3px 3px;border-radius: 3px 0 0 3px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)",
      "background-color: #bc81e0;background-image: linear-gradient(90deg, #854D0E, #EAB308);color: #fff;padding: 3px 3px 3px 2px;border-radius: 0 3px 3px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)",
      "background-color: transparent",
    );
  },
});
