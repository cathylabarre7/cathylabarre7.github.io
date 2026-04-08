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
