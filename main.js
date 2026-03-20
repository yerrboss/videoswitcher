document.addEventListener("DOMContentLoaded", () => {
  console.log("VaDA Switcher: Checkpoint - Full Pro Logic Integrated");

  // --- 1. GLOBAL SELECTORS ---
  const joyStick = document.getElementById("joy-stick");
  const fineHandles = document.querySelectorAll(".fine-handle");
  const menu = document.getElementById("sidebar-popup-menu");
  const trigger = document.getElementById("popup-trigger");
  const bottomArea = document.querySelector(".bottom-area");
  const inspectorTitle = document.getElementById("inspector-title");
  const mixerContainer = document.querySelector(".mixer-scroll-area");
  let activeEl = null;

  // --- 2. SLIDER HELPER FUNCTION ---
  const updateMiniSlider = (slider, fillId) => {
    if (!slider) return;
    const fill = document.getElementById(fillId);
    if (fill) {
      if (slider.id === "warp-slider") {
        const percent = ((parseFloat(slider.value) + 1000) / 2000) * 100;
        fill.style.width = percent + "%";
        const tooltip = document.getElementById("warp-tooltip");
        if (tooltip) {
          tooltip.innerText = slider.value;
          tooltip.style.left = percent + "%";
        }
      } else {
        fill.style.width = slider.value + "%";
      }
    }
  };

  // --- 3. AUDIO CHANNEL GENERATOR ---
  const generateMixer = () => {
    if (!mixerContainer || mixerContainer.children.length > 0) return;
    mixerContainer.innerHTML = "";
    for (let i = 1; i <= 16; i++) {
      const channel = document.createElement("div");
      channel.className = "mixer-channel";
      channel.innerHTML = `
                <div class="cam-peek-container">
                    <div class="cam-peek-thumb">CAM ${i}</div>
                </div>
                <div class="stereo-unit-recessed">
                    <div class="meter-track"><div class="meter-fill" style="height: 0%"></div></div>
                    <div class="meter-track"><div class="meter-fill" style="height: 0%"></div></div>
                </div>
                <div class="ms-display">10 ms</div>
                <button class="mute-btn-vada">
                    <img src="assets/icons/audio-icon-mute.svg" alt="Mute">
                </button>
            `;
      mixerContainer.appendChild(channel);
    }
  };

  // --- 4. TAB NAVIGATION LOGIC (DUAL ACTION) ---
  const switchTab = (tabName, title) => {
    // A. Update Inspector (Middle/Right)
    const target = document.getElementById("content-" + tabName);
    if (target) {
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      target.classList.add("active");
      if (inspectorTitle) inspectorTitle.innerText = title;
    }

    // B. Update Media Bin (Left)
    const binTarget = document.getElementById("bin-" + tabName);
    const allBins = document.querySelectorAll(".bin-context");
    if (binTarget) {
      allBins.forEach((b) => b.classList.remove("active"));
      binTarget.classList.add("active");
    } else if (allBins.length > 0) {
      // If the tab doesn't have a specific bin (like Audio), default to Overlay bin
      allBins.forEach((b) => b.classList.remove("active"));
      document.getElementById("bin-overlay")?.classList.add("active");
    }

    // C. Special Layout Actions
    if (tabName === "audio") {
      bottomArea.classList.add("audio-expanded");
      generateMixer();
    } else {
      bottomArea.classList.remove("audio-expanded");
    }

    if (tabName === "vcam") syncSockets();
    refreshTabSliders(tabName);
  };

  const refreshTabSliders = (tab) => {
    const configs = [
      { id: "margin-slider", fill: "margin-fill" },
      { id: "edge-slider", fill: "edge-fill" },
      { id: "warp-slider", fill: "warp-fill" }
    ];
    configs.forEach(conf => {
        const el = document.getElementById(conf.id);
        if(el) updateMiniSlider(el, conf.fill);
    });
  };

  // --- 5. AUDIO TOGGLE ---
  if (mixerContainer) {
    mixerContainer.addEventListener("click", (e) => {
      const channel = e.target.closest(".mixer-channel");
      const isPeek = e.target.closest(".cam-peek-thumb");
      if (channel && !isPeek) {
        e.preventDefault();
        channel.classList.toggle("active");
        const btn = channel.querySelector(".mute-btn-vada");
        if (btn) {
          btn.classList.toggle("active", channel.classList.contains("active"));
          const img = btn.querySelector("img");
          if (img) {
            const isActive = channel.classList.contains("active");
            img.src = isActive ? "assets/icons/audio-icon-active.svg" : "assets/icons/audio-icon-mute.svg";
          }
        }
      }
    });
  }

  const masterSlider = document.getElementById("master-slider");
  const masterFill = document.getElementById("master-fill");
  let globalVolume = 1.0;

  masterSlider?.addEventListener("input", (e) => {
    const val = e.target.value;
    globalVolume = val / 100;
    if (masterFill) masterFill.style.width = val + "%";
  });

  setInterval(() => {
    if (bottomArea.classList.contains("audio-expanded")) {
      document.querySelectorAll(".mixer-channel.active .meter-fill").forEach((fill) => {
        const level = (Math.floor(Math.random() * 55) + 25) * globalVolume;
        fill.style.height = level + "%";
      });
    }
  }, 120);

  // --- 6. CAMERA PROGRESS BARS ---
  document.querySelectorAll(".cam-item").forEach((cam) => {
    cam.addEventListener("click", function () {
      const bar = this.querySelector(".progress-bar");
      if (!bar) return;
      this.classList.remove("warning");
      bar.style.transition = "none";
      bar.style.width = "0%";
      void bar.offsetWidth;
      bar.style.transition = "width 10s linear";
      bar.style.width = "100%";
      setTimeout(() => {
        if (bar.style.width === "100%") this.classList.add("warning");
      }, 7000);
    });
  });

  // --- 7. VCAM / JOYSTICK ---
  const syncSockets = () => {
    fineHandles.forEach((h) => {
      h.style.left = "50%"; h.style.top = "50%";
      h.style.transform = "translate(-50%, -50%)";
    });
    if (joyStick) joyStick.style.transform = "translate(0,0)";
  };

  const updateHandlePosition = (e) => {
    if (!activeEl) return;
    const rect = activeEl.parentElement.getBoundingClientRect();
    const isH = activeEl.parentElement.parentElement.classList.contains("horizontal");
    let percent = isH ? ((e.clientX - rect.left) / rect.width) * 100 : ((e.clientY - rect.top) / rect.height) * 100;
    if (isH) { activeEl.style.left = Math.max(0, Math.min(percent, 100)) + "%"; activeEl.style.top = "50%"; }
    else { activeEl.style.top = Math.max(0, Math.min(percent, 100)) + "%"; activeEl.style.left = "50%"; }
    activeEl.style.transform = "translate(-50%, -50%)";
  };

  document.addEventListener("mousedown", (e) => {
    const handle = e.target.closest(".fine-handle") || e.target.closest("#joy-stick");
    if (handle) {
      activeEl = handle;
      activeEl.style.transition = "none";
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!activeEl) return;
    const rect = activeEl.parentElement.getBoundingClientRect();
    if (activeEl === joyStick) {
      const centerX = rect.width / 2, centerY = rect.height / 2;
      let dx = e.clientX - rect.left - centerX, dy = e.clientY - rect.top - centerY;
      const max = rect.width / 2 - 20;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > max) {
        const angle = Math.atan2(dy, dx);
        dx = Math.cos(angle) * max; dy = Math.sin(angle) * max;
      }
      activeEl.style.transform = `translate(${dx}px, ${dy}px)`;
    } else {
      updateHandlePosition(e);
    }
  });

  document.addEventListener("mouseup", () => {
    if (!activeEl) return;
    activeEl.style.transition = "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    if (activeEl === joyStick) activeEl.style.transform = "translate(0, 0)";
    else { activeEl.style.left = "50%"; activeEl.style.top = "50%"; activeEl.style.transform = "translate(-50%, -50%)"; }
    activeEl = null;
  });

  // --- 8. UI HOOKS & SLIDERS ---
  const sliderConfigs = [
    { id: "warp-slider", fill: "warp-fill" },
    { id: "margin-slider", fill: "margin-fill" },
    { id: "edge-slider", fill: "edge-fill" },
    { id: "text-opacity-slider", fill: "text-opacity-fill" },
    { id: "bg-opacity-slider", fill: "bg-opacity-fill" },
    { id: "scroll-speed-slider", fill: "scroll-speed-fill" },
  ];

  sliderConfigs.forEach((s) => {
    const el = document.getElementById(s.id);
    el?.addEventListener("input", () => updateMiniSlider(el, s.fill));
  });

  document.querySelectorAll(".tool-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      const symbol = icon.innerText.trim();
      if (symbol === "🔳") switchTab("overlay", "Overlay / DSK");
      if (symbol === "▤") switchTab("layouts", "Monitor Layouts");
      if (symbol === "⛶") switchTab("templates", "Scene Templates");
      if (symbol === "T") switchTab("text", "Text Overlay");
      if (symbol === "🔊") switchTab("audio", "Audio Mixer");
    });
  });

  // --- 9. POPUP & RESETS ---
  trigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.top = trigger.getBoundingClientRect().top + "px";
    menu.style.left = trigger.getBoundingClientRect().right + 10 + "px";
    menu.classList.toggle("show");
  });

  menu?.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      switchTab(li.dataset.value, li.innerText);
      menu.classList.remove("show");
    });
  });

  document.getElementById("vcam-reset")?.addEventListener("click", syncSockets);
  document.getElementById("reset-warp-btn")?.addEventListener("click", () => {
    const s = document.getElementById("warp-slider");
    if (s) { s.value = 0; updateMiniSlider(s, "warp-fill"); }
  });

  document.addEventListener("click", () => menu?.classList.remove("show"));
  syncSockets();
});
