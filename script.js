const skillBoxes = document.querySelectorAll(
  ".skill-category, .softskills-box",
);

if (skillBoxes.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    {
      threshold: 0.2,
    },
  );

  skillBoxes.forEach((box) => observer.observe(box));
}

async function chargerVeilleRSS() {
  const conteneur = document.getElementById("rss-articles");

  if (!conteneur) return;

  const flux = "https://www.it-connect.fr/feed/";
  const proxy = "https://proxy.cors.dev/";

  try {
    const reponse = await fetch(proxy + flux, {
      credentials: "omit"
    });

    if (!reponse.ok) {
      throw new Error("Erreur HTTP : " + reponse.status);
    }

    const xmlTexte = await reponse.text();
    const xml = new DOMParser().parseFromString(
      xmlTexte,
      "application/xml"
    );

    if (xml.querySelector("parsererror")) {
      throw new Error("Le flux RSS reçu est invalide.");
    }

    const articles = [...xml.querySelectorAll("item")];

    if (articles.length === 0) {
      throw new Error("Aucun article trouvé.");
    }

    conteneur.replaceChildren();

    articles.slice(0, 6).forEach((article) => {
      const carte = document.createElement("article");
      carte.className = "rss-card";

      const titre = document.createElement("h3");
      const lien = document.createElement("a");

      lien.textContent =
        article.querySelector("title")?.textContent.trim() ||
        "Article sans titre";

      const url = article.querySelector("link")?.textContent.trim() || "";

      if (url.startsWith("https://") || url.startsWith("http://")) {
        lien.href = url;
        lien.target = "_blank";
        lien.rel = "noopener noreferrer";
      }

      titre.appendChild(lien);

      const date = document.createElement("p");
      date.className = "rss-date";

      const dateTexte =
        article.querySelector("pubDate")?.textContent.trim() || "";
      const dateArticle = new Date(dateTexte);

      date.textContent = Number.isNaN(dateArticle.getTime())
        ? "Date non disponible"
        : dateArticle.toLocaleDateString("fr-FR");

      const resume = document.createElement("p");
      const description =
        article.querySelector("description")?.textContent || "";

      const texte = new DOMParser()
        .parseFromString(description, "text/html")
        .body.textContent.trim()
        .replace(/\s+/g, " ");

      resume.textContent =
        texte.length > 220
          ? texte.slice(0, 220) + "..."
          : texte;

      carte.append(titre, date, resume);
      conteneur.appendChild(carte);
    });
  } catch (erreur) {
    console.error("Erreur RSS :", erreur);

    conteneur.textContent =
      "Impossible de charger les articles pour le moment. " +
      "Consultez directement le site IT Connect.";
  }
}

chargerVeilleRSS();
