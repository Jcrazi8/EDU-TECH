/* =====================================================================
   EduTech – Practice Certification Test (certify.js)
   ---------------------------------------------------------------------
   Adds an in-browser certification course to certify.html.
   Flow: pick a track  →  read 5 short lessons  →  answer 5 quiz Qs
         →  if 4/5 or better, enter your name → download PDF certificate
   No CSS files are touched — all UI is injected as a modal overlay
   styled inline so the rest of the site looks identical.
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. CONTENT — three certification tracks
     Each track has 5 lessons (study guide) and 5 multiple-choice
     questions. Pass = 4 correct out of 5.
     ------------------------------------------------------------------ */
  const CERT_TRACKS = {
    hardware: {
      title: 'Hardware Fundamentals',
      icon: 'fa-microchip',
      blurb: 'Learn the parts that make a computer work – RAM, motherboard, PSU, BIOS, and how to troubleshoot them.',
      lessons: [
        {
          title: 'Lesson 1 – RAM (Random Access Memory)',
          body: 'RAM is your computer\'s short-term memory. While the hard drive or SSD stores files long-term, RAM holds the programs you are using right now so the CPU can reach them in nanoseconds. More RAM means more programs can be open at the same time without slowing down.\n\nRAM is volatile, which means it forgets everything when the power turns off. That is why your work is lost if you do not save before a crash. Common types today are DDR4 and DDR5, and they plug into long slots on the motherboard. When upgrading, you must match the type and speed your motherboard supports.\n\nIf a computer freezes, gets blue screens, or shows random crashes, faulty RAM is one of the first things a technician tests using a tool called MemTest86.'
        },
        {
          title: 'Lesson 2 – The Motherboard',
          body: 'The motherboard is the main circuit board everything plugs into. It is the highway that connects the CPU, RAM, GPU, storage, USB ports, and power supply. Without a motherboard, no part can talk to another part.\n\nKey areas to know: the CPU socket (where the processor sits), the RAM slots (DIMM slots), PCIe slots (for graphics cards and expansion), SATA and M.2 connectors (for storage), and the I/O panel on the back (USB, audio, ethernet).\n\nMotherboards come in sizes called form factors – ATX is full size, microATX is smaller, and Mini-ITX is the smallest. The form factor must fit the case, and the chipset must match the CPU brand (Intel or AMD).'
        },
        {
          title: 'Lesson 3 – Power Supply Unit (PSU)',
          body: 'The PSU takes wall power (AC) and converts it to the low-voltage DC power that computer parts need. It is rated in watts – a basic office PC may need 400W, a gaming PC with a strong GPU may need 750W or more.\n\nLook for the 80 Plus rating (Bronze, Gold, Platinum) which tells you how efficient it is. A higher rating wastes less energy as heat and saves money over time.\n\nA failing PSU is dangerous: it can shut down randomly, refuse to power on, or in rare cases damage other parts. Never open a PSU – the capacitors inside can hold a lethal charge even when unplugged.'
        },
        {
          title: 'Lesson 4 – BIOS / UEFI',
          body: 'BIOS (Basic Input/Output System) is the first software that runs when you press the power button. Modern computers use UEFI, which is a faster, prettier replacement, but most people still call it the BIOS.\n\nIts job is to wake up the hardware, run a quick self-test (POST), and then hand off to the operating system. You enter the BIOS by tapping a key during boot – usually Del, F2, F10, or F12.\n\nFrom the BIOS you can change boot order (so you can install Windows from a USB), enable virtualization for VMs, update firmware, and check temperatures. Be careful – the wrong setting here can stop the machine from booting.'
        },
        {
          title: 'Lesson 5 – Troubleshooting Hardware',
          body: 'When a PC will not turn on, work from the outside in. Step 1: is it plugged in and is the wall outlet live? Step 2: any lights or fans? No lights usually means PSU or power button. Step 3: lights but no display? Reseat the RAM and the GPU – a loose stick is the #1 cause of "dead" PCs.\n\nListen for beep codes from the motherboard speaker. A long-short pattern often means RAM, three short beeps often means video. The pattern depends on the BIOS brand (look it up).\n\nAlways unplug the PSU and press the power button for 10 seconds to drain residual power before opening a case. Use an anti-static wrist strap or touch the metal case to avoid frying parts with static electricity.'
        }
      ],
      questions: [
        { q: 'Which type of memory is volatile and loses its contents when power is removed?',
          options: ['SSD', 'RAM', 'Hard Drive', 'BIOS chip'], a: 1 },
        { q: 'Which component connects every other component together?',
          options: ['Power Supply', 'CPU', 'Motherboard', 'GPU'], a: 2 },
        { q: 'What does an 80 Plus Gold rating describe on a PSU?',
          options: ['Color', 'Wattage', 'Energy efficiency', 'Brand quality'], a: 2 },
        { q: 'Which key is most commonly pressed at boot to enter BIOS / UEFI?',
          options: ['Tab', 'Caps Lock', 'Del or F2', 'Spacebar'], a: 2 },
        { q: 'A PC has lights and fans but no display. What is the most common first fix?',
          options: ['Replace the CPU', 'Reseat the RAM and GPU', 'Reinstall Windows', 'Buy a new monitor'], a: 1 }
      ]
    },

    networking: {
      title: 'Networking Basics',
      icon: 'fa-network-wired',
      blurb: 'Understand how devices talk to each other – IP addresses, DNS, DHCP, the OSI model, and the ping command.',
      lessons: [
        {
          title: 'Lesson 1 – IP Addressing',
          body: 'Every device on a network needs a unique IP address, like a house needs a street address. IPv4 addresses look like 192.168.1.10 – four numbers from 0 to 255 separated by dots. IPv6 is the newer, longer version with letters and colons.\n\nIPs come in two flavors: public (your router\'s address on the internet, given by your ISP) and private (the addresses inside your home, like 192.168.x.x or 10.x.x.x). Private addresses are reused by every home network in the world, that is why they are private.\n\nA subnet mask (like 255.255.255.0) tells the device which part of the IP is the network and which part is the host. Without it, your computer would not know whether another address is on the same network or across the internet.'
        },
        {
          title: 'Lesson 2 – DNS (Domain Name System)',
          body: 'DNS is the phone book of the internet. You type google.com but computers only understand IP addresses, so DNS translates the friendly name into something like 142.250.190.46.\n\nWhen you type a URL, your computer first checks its own cache, then asks your router, then your ISP\'s DNS server, and finally the internet root servers if no one knows the answer. The result is cached for a short time so the next visit is faster.\n\nIf the internet "feels broken" but everything technically works, swapping your DNS server to a public one like Cloudflare\'s 1.1.1.1 or Google\'s 8.8.8.8 often fixes it.'
        },
        {
          title: 'Lesson 3 – DHCP (Dynamic Host Configuration Protocol)',
          body: 'DHCP is the service that hands out IP addresses automatically. Without it, you would have to type an IP, subnet mask, gateway, and DNS into every device by hand. Painful.\n\nWhen a device joins the network, it shouts "I need an address!" and the DHCP server (usually built into your router) replies with a free IP, the subnet mask, the default gateway, and DNS server – all in one shot. The address is leased for a set time (often 24 hours) and then renewed.\n\nServers and printers are sometimes given a static (manually set) IP so their address never changes, but laptops and phones almost always use DHCP.'
        },
        {
          title: 'Lesson 4 – The OSI Model',
          body: 'The OSI model breaks networking into 7 layers, top to bottom: Application, Presentation, Session, Transport, Network, Data Link, Physical. Each layer does one job and only talks to the layer above and below it.\n\nQuick examples by layer: Layer 7 = your web browser, Layer 4 = TCP/UDP, Layer 3 = IP addresses and routers, Layer 2 = MAC addresses and switches, Layer 1 = the actual cable or wifi signal.\n\nWhy memorize it? Because troubleshooting becomes easier – if your cable is unplugged that is Layer 1, if your IP is wrong that is Layer 3, if a website blocks you that is Layer 7. A common memory trick: "Please Do Not Throw Sausage Pizza Away."'
        },
        {
          title: 'Lesson 5 – The Ping Command',
          body: 'Ping is the simplest network test. It sends a tiny packet to another device and waits for a reply. If the reply comes back, the two are connected. The time it takes (in milliseconds) shows the latency.\n\nOpen the terminal/command prompt and type: ping google.com. You will see four replies and a summary. Replies = good, "Request timed out" or 100% packet loss = something is broken between you and the target.\n\nUse ping to isolate problems: ping 127.0.0.1 (does my own network stack work?), ping your gateway (does my LAN work?), ping 8.8.8.8 (does the internet work?), ping google.com (does DNS work?). Each step narrows the problem.'
        }
      ],
      questions: [
        { q: 'Which range is a typical PRIVATE IPv4 address?',
          options: ['8.8.8.8', '142.250.190.46', '192.168.1.10', '203.0.113.5'], a: 2 },
        { q: 'What is the main job of DNS?',
          options: ['Assign IP addresses', 'Translate names to IPs', 'Encrypt traffic', 'Speed up downloads'], a: 1 },
        { q: 'Which protocol automatically gives a device an IP address?',
          options: ['DNS', 'DHCP', 'HTTP', 'FTP'], a: 1 },
        { q: 'IP addresses and routers operate at which OSI layer?',
          options: ['Layer 1 (Physical)', 'Layer 2 (Data Link)', 'Layer 3 (Network)', 'Layer 7 (Application)'], a: 2 },
        { q: 'Pinging 127.0.0.1 tests what?',
          options: ['Your ISP', 'Google', 'Your own network stack', 'Your firewall rules'], a: 2 }
      ]
    },

    security: {
      title: 'Security & Cleanup',
      icon: 'fa-shield-halved',
      blurb: 'Protect users from malware, weak passwords, and phishing – and learn how to keep machines clean and backed up.',
      lessons: [
        {
          title: 'Lesson 1 – Malware Types',
          body: 'Malware is any software made to harm or spy on a user. The main types: Viruses attach to real programs and spread when run. Worms spread on their own across networks. Trojans pretend to be something useful but carry a payload. Ransomware encrypts your files and demands payment. Spyware silently records what you do. Adware throws pop-ups everywhere.\n\nMost modern malware is a mix – a phishing email drops a Trojan, which downloads ransomware. A good antivirus catches most of it, but humans are the weakest link.\n\nFirst signs of infection: weird pop-ups, browser homepage changed, fans always loud (mining), files renamed with strange extensions, antivirus disabled.'
        },
        {
          title: 'Lesson 2 – Password Hygiene',
          body: 'Passwords are still the front door to most accounts, so they need to be strong. Rules from NIST and modern security guides: long beats complex – a 16-character passphrase like "BlueTurtleEatsCheese!" is harder to crack than "P@ss1!".\n\nNever reuse passwords across sites. When one site gets breached, attackers try the same email/password everywhere. Use a password manager (Bitwarden, 1Password) to remember unique passwords for every account.\n\nTurn on Multi-Factor Authentication (MFA) wherever possible – an app code or hardware key adds a second lock that a stolen password alone cannot open.'
        },
        {
          title: 'Lesson 3 – Firewalls',
          body: 'A firewall is a guard that watches network traffic and lets only approved traffic through. There are two flavors: a software firewall on each computer (like Windows Defender Firewall) and a hardware firewall built into your router or a separate appliance.\n\nFirewalls work on rules: allow or block traffic based on source IP, destination IP, port number, or protocol. By default a good firewall blocks all incoming traffic and allows outgoing – this is why you have to "allow through firewall" when installing some games.\n\nNext-gen firewalls also inspect the actual content of packets (deep packet inspection) and can stop known attacks, not just block ports.'
        },
        {
          title: 'Lesson 4 – Backups',
          body: 'A computer that is not backed up is a computer waiting to lose data. The 3-2-1 rule is industry standard: 3 copies of the data, on 2 different types of media, with 1 copy off-site (cloud or another building).\n\nBackup types: full (everything every time, slow but simple), incremental (only what changed since last backup, fast), differential (everything since last full, middle ground). Tools include Windows File History, macOS Time Machine, Backblaze, and enterprise tools like Veeam.\n\nRansomware is the #1 reason backups exist – if your live files are encrypted, you wipe and restore from a clean backup instead of paying.'
        },
        {
          title: 'Lesson 5 – Phishing',
          body: 'Phishing is when an attacker pretends to be a trusted source (your bank, your boss, IT support) to trick you into clicking a link, opening a file, or giving credentials. It is the most common way real breaches start.\n\nRed flags: urgent tone ("act now or your account is closed"), generic greeting ("Dear Customer"), mismatched sender domain (support@arnaz0n.com), shortened or strange links, unexpected attachments. Hover over a link before clicking to see where it really goes.\n\nSpear phishing is targeted at one person and often references real coworkers or projects – much harder to spot. When in doubt, call the sender on a known number, do not reply or click.'
        }
      ],
      questions: [
        { q: 'Which malware type encrypts your files and demands payment?',
          options: ['Adware', 'Spyware', 'Ransomware', 'Worm'], a: 2 },
        { q: 'Which password is strongest in modern guidance?',
          options: ['P@ss1!', 'password123', 'BlueTurtleEatsCheese!', 'Summer2025'], a: 2 },
        { q: 'A firewall mainly does what?',
          options: ['Speeds up Wi-Fi', 'Filters network traffic by rules', 'Stores backups', 'Translates DNS'], a: 1 },
        { q: 'The 3-2-1 backup rule means:',
          options: ['3 copies, 2 media, 1 off-site', '3 days, 2 weeks, 1 month', '3 drives in one PC', '3 logins, 2 firewalls, 1 antivirus'], a: 0 },
        { q: 'Which is a classic phishing red flag?',
          options: ['HTTPS lock icon', 'Urgent tone and generic greeting', 'Email from a known coworker', 'A signed PDF'], a: 1 }
      ]
    }
  };

  /* ------------------------------------------------------------------
     2. STATE
     ------------------------------------------------------------------ */
  let activeTrack = null;
  let lessonIndex = 0;
  let answers = [];

  /* ------------------------------------------------------------------
     3. MODAL HELPERS  – injected, not in CSS files
     ------------------------------------------------------------------ */
  function ensureModal() {
    let m = document.getElementById('certModal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'certModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);display:none;align-items:center;justify-content:center;z-index:9999;padding:1rem;font-family:var(--font-body, Inter, sans-serif);';
    m.innerHTML = '<div id="certModalBox" style="background:var(--card,#11151c);color:var(--text,#e8eaed);max-width:720px;width:100%;max-height:90vh;overflow-y:auto;border:1px solid var(--border,#333);border-radius:14px;padding:2rem;position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.55);"><button id="certClose" style="position:absolute;top:0.75rem;right:0.75rem;background:transparent;color:#aaa;border:none;font-size:1.4rem;cursor:pointer;">&times;</button><div id="certBody"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) {
      if (e.target === m) closeModal();
    });
    m.querySelector('#certClose').addEventListener('click', closeModal);
    return m;
  }

  function openModal() {
    const m = ensureModal();
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const m = document.getElementById('certModal');
    if (m) m.style.display = 'none';
    document.body.style.overflow = '';
  }

  function setBody(html) {
    const b = document.getElementById('certBody');
    if (b) b.innerHTML = html;
  }

  function btnPrimary(label, id) {
    return '<button id="' + id + '" style="background:linear-gradient(90deg,#7b2ff7,#3a8dff);color:#fff;border:none;padding:0.75rem 1.4rem;border-radius:10px;font-weight:600;cursor:pointer;font-size:0.95rem;">' + label + '</button>';
  }
  function btnGhost(label, id) {
    return '<button id="' + id + '" style="background:transparent;color:#cfd2d6;border:1px solid #444;padding:0.7rem 1.3rem;border-radius:10px;font-weight:500;cursor:pointer;font-size:0.95rem;">' + label + '</button>';
  }

  /* ------------------------------------------------------------------
     4. SCREENS
     ------------------------------------------------------------------ */
  function screenTrackPicker() {
    activeTrack = null;
    lessonIndex = 0;
    answers = [];
    let html = '<h2 style="font-family:var(--font-display,Syne);font-size:1.8rem;margin:0 0 0.4rem;">Practice Certification Test</h2>' +
               '<p style="color:#a0a4aa;margin:0 0 1.5rem;">Pick a track. You will read 5 short lessons, take a 5-question quiz, and earn a downloadable PDF certificate if you score 4 / 5 or higher.</p>' +
               '<div style="display:grid;gap:1rem;">';
    Object.keys(CERT_TRACKS).forEach(function (key) {
      const t = CERT_TRACKS[key];
      html += '<div data-track="' + key + '" class="cert-pick" style="border:1px solid #333;border-radius:12px;padding:1.1rem 1.2rem;cursor:pointer;transition:all 0.2s;background:rgba(255,255,255,0.02);">' +
                '<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.4rem;"><i class="fa-solid ' + t.icon + '" style="color:#3a8dff;font-size:1.3rem;"></i><h3 style="margin:0;font-size:1.15rem;">' + t.title + '</h3></div>' +
                '<p style="margin:0;color:#9aa0a6;font-size:0.92rem;">' + t.blurb + '</p>' +
              '</div>';
    });
    html += '</div>';
    setBody(html);
    document.querySelectorAll('.cert-pick').forEach(function (el) {
      el.addEventListener('mouseenter', function () { el.style.borderColor = '#3a8dff'; });
      el.addEventListener('mouseleave', function () { el.style.borderColor = '#333'; });
      el.addEventListener('click', function () {
        activeTrack = el.getAttribute('data-track');
        lessonIndex = 0;
        screenLesson();
      });
    });
  }

  function screenLesson() {
    const t = CERT_TRACKS[activeTrack];
    const l = t.lessons[lessonIndex];
    const total = t.lessons.length;
    const pct = Math.round(((lessonIndex + 1) / total) * 100);
    const html =
      '<div style="font-size:0.8rem;color:#7b8088;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.08em;">' + t.title + ' · Study Guide</div>' +
      '<h2 style="font-family:var(--font-display,Syne);font-size:1.55rem;margin:0 0 0.6rem;">' + l.title + '</h2>' +
      '<div style="height:6px;background:#222;border-radius:99px;margin-bottom:1.2rem;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#7b2ff7,#3a8dff);"></div></div>' +
      '<div style="white-space:pre-wrap;line-height:1.65;color:#d8dadd;font-size:0.97rem;">' + l.body + '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:1.6rem;gap:0.5rem;">' +
        btnGhost(lessonIndex === 0 ? 'Cancel' : '← Back', 'lessonBack') +
        btnPrimary(lessonIndex === total - 1 ? 'Start Quiz →' : 'Next Lesson →', 'lessonNext') +
      '</div>';
    setBody(html);
    document.getElementById('lessonBack').addEventListener('click', function () {
      if (lessonIndex === 0) screenTrackPicker();
      else { lessonIndex--; screenLesson(); }
    });
    document.getElementById('lessonNext').addEventListener('click', function () {
      if (lessonIndex === total - 1) { answers = []; screenQuiz(0); }
      else { lessonIndex++; screenLesson(); }
    });
  }

  function screenQuiz(qi) {
    const t = CERT_TRACKS[activeTrack];
    const q = t.questions[qi];
    const total = t.questions.length;
    const pct = Math.round(((qi + 1) / total) * 100);
    let optsHtml = '';
    q.options.forEach(function (opt, i) {
      optsHtml += '<label class="cert-opt" data-i="' + i + '" style="display:block;border:1px solid #333;border-radius:10px;padding:0.85rem 1rem;margin-bottom:0.55rem;cursor:pointer;transition:all 0.15s;">' +
                    '<input type="radio" name="quizopt" value="' + i + '" style="margin-right:0.6rem;"/>' + opt +
                  '</label>';
    });
    const html =
      '<div style="font-size:0.8rem;color:#7b8088;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.08em;">' + t.title + ' · Quiz · Question ' + (qi + 1) + ' of ' + total + '</div>' +
      '<h2 style="font-family:var(--font-display,Syne);font-size:1.4rem;margin:0 0 0.8rem;">' + q.q + '</h2>' +
      '<div style="height:6px;background:#222;border-radius:99px;margin-bottom:1.2rem;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#7b2ff7,#3a8dff);"></div></div>' +
      '<form id="quizForm">' + optsHtml + '</form>' +
      '<div style="display:flex;justify-content:space-between;margin-top:1.4rem;">' +
        btnGhost('← Back', 'quizBack') +
        btnPrimary(qi === total - 1 ? 'See Results →' : 'Next →', 'quizNext') +
      '</div>';
    setBody(html);
    document.querySelectorAll('.cert-opt').forEach(function (el) {
      el.addEventListener('mouseenter', function () { el.style.borderColor = '#3a8dff'; });
      el.addEventListener('mouseleave', function () { el.style.borderColor = '#333'; });
    });
    document.getElementById('quizBack').addEventListener('click', function () {
      if (qi === 0) screenLesson();
      else { answers.pop(); screenQuiz(qi - 1); }
    });
    document.getElementById('quizNext').addEventListener('click', function () {
      const sel = document.querySelector('input[name="quizopt"]:checked');
      if (!sel) { alert('Please pick an answer.'); return; }
      answers[qi] = parseInt(sel.value, 10);
      if (qi === total - 1) screenResults();
      else screenQuiz(qi + 1);
    });
  }

  function screenResults() {
    const t = CERT_TRACKS[activeTrack];
    let correct = 0;
    t.questions.forEach(function (q, i) { if (answers[i] === q.a) correct++; });
    const passed = correct >= 4;
    const pct = Math.round((correct / t.questions.length) * 100);

    let reviewHtml = '<div style="margin-top:1.4rem;border-top:1px solid #2a2e36;padding-top:1.2rem;">';
    t.questions.forEach(function (q, i) {
      const right = answers[i] === q.a;
      reviewHtml += '<div style="margin-bottom:0.9rem;">' +
        '<div style="font-weight:600;font-size:0.92rem;color:#cfd2d6;">' + (i + 1) + '. ' + q.q + '</div>' +
        '<div style="font-size:0.88rem;color:' + (right ? '#5fd28a' : '#ff7676') + ';">Your answer: ' + q.options[answers[i]] + ' ' + (right ? '✓' : '✗') + '</div>' +
        (right ? '' : '<div style="font-size:0.88rem;color:#9aa0a6;">Correct: ' + q.options[q.a] + '</div>') +
        '</div>';
    });
    reviewHtml += '</div>';

    let html =
      '<div style="text-align:center;">' +
      '<div style="font-size:3rem;margin-bottom:0.3rem;">' + (passed ? '🎓' : '📘') + '</div>' +
      '<h2 style="font-family:var(--font-display,Syne);font-size:1.8rem;margin:0 0 0.4rem;">' + (passed ? 'You Passed!' : 'Almost There') + '</h2>' +
      '<p style="margin:0 0 0.4rem;color:#a0a4aa;">' + t.title + ' Practice Test</p>' +
      '<div style="font-size:2.4rem;font-weight:800;margin:0.6rem 0;background:linear-gradient(90deg,#7b2ff7,#3a8dff);-webkit-background-clip:text;color:transparent;">' + correct + ' / ' + t.questions.length + ' (' + pct + '%)</div>' +
      '<p style="color:#9aa0a6;margin:0 0 1.4rem;">' + (passed ? 'Great job. Enter your name below and download your certificate.' : 'You need 4 out of 5 to earn the certificate. Review the lessons and try again.') + '</p>' +
      '</div>';

    if (passed) {
      html += '<div style="display:flex;gap:0.6rem;margin-bottom:1rem;">' +
              '<input id="certName" placeholder="Your full name" style="flex:1;padding:0.8rem 1rem;border-radius:10px;border:1px solid #444;background:#0c0f14;color:#fff;font-size:0.95rem;"/>' +
              btnPrimary('Download Certificate ⬇', 'certDownload') +
              '</div>';
    }
    html += reviewHtml;
    html += '<div style="display:flex;justify-content:center;gap:0.6rem;margin-top:1.2rem;">' +
            btnGhost('Try Another Track', 'resultsRestart') +
            btnGhost('Close', 'resultsClose') +
            '</div>';
    setBody(html);

    document.getElementById('resultsRestart').addEventListener('click', screenTrackPicker);
    document.getElementById('resultsClose').addEventListener('click', closeModal);
    if (passed) {
      document.getElementById('certDownload').addEventListener('click', function () {
        const name = (document.getElementById('certName').value || '').trim();
        if (!name) { alert('Please enter your name first.'); return; }
        generateCertificatePDF(name, t.title, correct, t.questions.length);
        // Log activity (Resend email + admin log)
        try {
          if (typeof window.logActivity === 'function') {
            window.logActivity('certification', {
              name: name,
              track: t.title,
              score: correct + '/' + t.questions.length,
              percent: pct + '%'
            });
          }
        } catch (e) { /* non-fatal */ }
      });
    }
  }

  /* ------------------------------------------------------------------
     5. PDF CERTIFICATE  (jsPDF — loaded from CDN in certify.html)
     ------------------------------------------------------------------ */
  function generateCertificatePDF(name, trackTitle, correct, total) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF library not loaded. Please refresh the page and try again.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Cream background
    doc.setFillColor(252, 248, 240);
    doc.rect(0, 0, W, H, 'F');

    // Outer purple border
    doc.setDrawColor(123, 47, 247);
    doc.setLineWidth(6);
    doc.rect(20, 20, W - 40, H - 40);

    // Inner thin blue border
    doc.setDrawColor(58, 141, 255);
    doc.setLineWidth(1.5);
    doc.rect(34, 34, W - 68, H - 68);

    // Top brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(58, 141, 255);
    doc.text('EDUTECH GLOBAL TECH SUPPORT ECOSYSTEM', W / 2, 80, { align: 'center' });

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(38);
    doc.setTextColor(20, 20, 30);
    doc.text('Certificate of Completion', W / 2, 145, { align: 'center' });

    // Subline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 90);
    doc.text('This certificate is proudly presented to', W / 2, 185, { align: 'center' });

    // Recipient name
    doc.setFont('times', 'italic');
    doc.setFontSize(44);
    doc.setTextColor(20, 20, 30);
    doc.text(name, W / 2, 245, { align: 'center' });

    // Underline under the name
    const nameW = doc.getTextWidth(name);
    doc.setDrawColor(123, 47, 247);
    doc.setLineWidth(1);
    doc.line(W / 2 - nameW / 2 - 20, 255, W / 2 + nameW / 2 + 20, 255);

    // Body text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 70);
    doc.text('for successfully completing the EduTech practice certification course in', W / 2, 290, { align: 'center' });

    // Track
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(123, 47, 247);
    doc.text(trackTitle, W / 2, 325, { align: 'center' });

    // Score
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(80, 80, 90);
    doc.text('Final Score: ' + correct + ' / ' + total, W / 2, 355, { align: 'center' });

    // Date
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text('Awarded on ' + dateStr, W / 2, 375, { align: 'center' });

    // Bottom signature line
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.6);
    doc.line(W / 2 - 110, H - 90, W / 2 + 110, H - 90);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 90);
    doc.text('Verified by EduTech Global Tech Support Ecosystem', W / 2, H - 72, { align: 'center' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 150);
    doc.text('eduutechh.netlify.app  ·  Bridging the gap between the known and the unknown', W / 2, H - 45, { align: 'center' });

    const safeTrack = trackTitle.replace(/[^a-z0-9]+/gi, '-');
    doc.save('EduTech-' + safeTrack + '-Certificate.pdf');
  }

  /* ------------------------------------------------------------------
     6. WIRE UP THE BUTTON
     ------------------------------------------------------------------ */
  function init() {
    const btn = document.getElementById('openCertCourse');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      ensureModal();
      openModal();
      screenTrackPicker();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
