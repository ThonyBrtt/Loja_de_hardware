
if (typeof firebase !== "undefined") {
  if (!window._firebaseInitialized) {
    const firebaseConfig = {
      apiKey: "AIzaSyB_Pd9n5VzXloRQvqusZUIhwZVmJvnKfQc",
      authDomain: "boombum-eaf32.firebaseapp.com",
      projectId: "boombum-eaf32",
      storageBucket: "boombum-eaf32.firebasestorage.app",
      messagingSenderId: "827065363375",
      appId: "1:827065363375:web:913f128e651fcdbe145d5a",
      measurementId: "G-D7CBRK53E0"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    window._firebaseInitialized = true;
  }


  if (!window.auth) window.auth = firebase.auth();
  if (!window.db) window.db = firebase.firestore();

 
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});


  window.addEventListener("load", () => {
    const userActions = document.getElementById("user-actions");
    if (!userActions) return;

    userActions.style.visibility = "hidden";

    auth.onAuthStateChanged((user) => {
      if (user) {
        const displayName = user.displayName || user.email.split("@")[0];
        userActions.innerHTML = `
          <span>Olá, <strong>${displayName}</strong></span><br>
          <a href="#" id="logout-btn" style="text-decoration:underline; color:#ffcc00;">Sair</a>
        `;

        document.getElementById("logout-btn").addEventListener("click", (e) => {
          e.preventDefault();
          auth.signOut().then(() => window.location.reload());
        });

      } else {
        userActions.innerHTML = `
          <a href="login.html" id="login-link" style="text-decoration:underline; color:white; margin-right:5px;">Entre</a>
          <span style="margin-right:5px;">ou</span><br>
          <a href="cadastro.html" id="signup-link" style="text-decoration:underline; color:white;">Cadastre-se</a>
        `;
      }

      userActions.style.visibility = "visible";
    });
  });
}
