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

const proxyRSS = "https://proxy.cors.dev/";

const fluxVeille = {
  virtualisation: [
    {
      url: "https://www.proxmox.com/en/about/company-details/press-releases?format=feed&type=rss",
      source: "Proxmox",
    },
    {
      url: "https://blogs.vmware.com/feed",
      source: "VMware",
    },
    {
      url: "https://www.it-connect.fr/feed/",
      source: "IT-Connect",
    },
  ],
  cybersecurite: [
    {
      url: "https://cert.cyber.gouv.fr/avis/feed/",
      source: "CERT-FR — Avis de sécurité",
    },
    {
      url: "https://cert.cyber.gouv.fr/alerte/feed/",
      source: "CERT-FR — Alertes",
    },
    {
      url: "https://www.it-connect.fr/feed/",
      source: "IT-Connect",
    },
  ],
};

const filtresVeille = {
  virtualisation:
    /virtualis|hyperviseur|hyper-v|vmware|proxmox|vcenter|vsphere|esxi|machine virtuelle|virtual machine|kvm/i,
  cybersecurite:
    /vulnérabilit|vulnerabilit|faille|CVE-\d|zero.day|exploité|attaque|rançongiciel|ransomware|correctif|avis de sécurité|alerte/i,
};

const requetesRSS = new Map();

async function lireFluxRSS(flux) {
  // Évite de télécharger deux fois le flux IT-Connect.
  if (!requetesRSS.has(flux.url)) {
    requetesRSS.set(
      flux.url,
      fetch(proxyRSS + flux.url, { credentials: "omit" }).then((reponse) => {
        if (!reponse.ok) {
          throw new Error(`Erreur HTTP ${reponse.status}`);
        }
        return reponse.text();
      }),
    );
  }

  const xmlTexte = await requetesRSS.get(flux.url);
  const xml = new DOMParser().parseFromString(xmlTexte, "application/xml");

  if (xml.querySelector("parsererror")) {
    throw new Error("Le flux reçu n’est pas un XML valide.");
  }

  return [...xml.querySelectorAll("item, entry")].map((item) => {
    const titre = item.querySelector("title")?.textContent?.trim() || "";

    const lienElement = item.querySelector("link");
    const lien =
      lienElement?.getAttribute("href") ||
      lienElement?.textContent?.trim() ||
      "";

    const dateTexte =
      item.querySelector("pubDate, published, updated, date")?.textContent?.trim() ||
      "";
    const date = new Date(dateTexte);

    const descriptionElement =
      item.querySelector("description, summary, content") ||
      item.getElementsByTagNameNS("*", "encoded")[0];

    const descriptionBrute = descriptionElement?.textContent || "";
    const description = new DOMParser()
      .parseFromString(descriptionBrute, "text/html")
      .body.textContent.trim()
      .replace(/\s+/g, " ");

    return {
      titre,
      lien,
      date,
      description,
      source: flux.source,
    };
  });
}

function afficherArticlesRSS(idConteneur, articles, filtre) {
  const conteneur = document.getElementById(idConteneur);
  if (!conteneur) return;

  const selection = articles
    .filter((article) => {
      const contenu = `${article.titre} ${article.description}`;
      return filtre.test(contenu) && /^https?:\/\//i.test(article.lien);
    })
    .sort((a, b) => {
      const dateA = Number.isNaN(a.date.getTime()) ? 0 : a.date.getTime();
      const dateB = Number.isNaN(b.date.getTime()) ? 0 : b.date.getTime();
      return dateB - dateA;
    })
    .filter(
      (article, index, liste) =>
        liste.findIndex((autre) => autre.lien === article.lien) === index,
    )
    .slice(0, 3);

  conteneur.replaceChildren();

  if (selection.length === 0) {
    conteneur.textContent =
      "Aucun article récent trouvé dans ce thème. Consulte les sources ci-dessous.";
    return;
  }

  selection.forEach((article) => {
    const carte = document.createElement("article");
    carte.className = "rss-card";

    const titre = document.createElement("h3");
    const lien = document.createElement("a");
    lien.href = article.lien;
    lien.target = "_blank";
    lien.rel = "noopener noreferrer";
    lien.textContent = article.titre || "Article sans titre";
    titre.appendChild(lien);

    const source = document.createElement("p");
    source.className = "rss-origin";
    source.textContent = article.source;

    const date = document.createElement("p");
    date.className = "rss-date";
    date.textContent = Number.isNaN(article.date.getTime())
      ? "Date non disponible"
      : article.date.toLocaleDateString("fr-FR");

    const resume = document.createElement("p");
    resume.textContent =
      article.description.length > 220
        ? article.description.slice(0, 220) + "…"
        : article.description || "Résumé non disponible.";

    carte.append(titre, source, date, resume);
    conteneur.appendChild(carte);
  });
}

async function chargerVeilleRSS() {
  const configurations = [
    {
      flux: fluxVeille.virtualisation,
      id: "rss-virtualisation",
      filtre: filtresVeille.virtualisation,
    },
    {
      flux: fluxVeille.cybersecurite,
      id: "rss-cybersecurite",
      filtre: filtresVeille.cybersecurite,
    },
  ];

  await Promise.all(
    configurations.map(async (configuration) => {
      const resultats = await Promise.allSettled(
        configuration.flux.map(lireFluxRSS),
      );
      const articles = resultats
        .filter((resultat) => resultat.status === "fulfilled")
        .flatMap((resultat) => resultat.value);

      afficherArticlesRSS(configuration.id, articles, configuration.filtre);
    }),
  );
}

chargerVeilleRSS();