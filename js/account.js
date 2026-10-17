(function () {
  "use strict";
  const auth = window.StoreAuth;
  const returnPath = auth.getSafeReturnPath();
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const authPanel = document.getElementById("auth-panel");
  const profilePanel = document.getElementById("profile-panel");

  function showMessage(id, message, success) {
    const target = document.getElementById(id);
    target.textContent = message;
    target.classList.toggle("success", Boolean(success));
  }

  function showSignedIn(account) {
    authPanel.hidden = true;
    profilePanel.hidden = false;
    document.getElementById("profile-name").textContent = account.name;
    document.getElementById("profile-email").textContent = account.email;
    document.getElementById("admin-profile-link").hidden = !auth.isAdmin();
    window.StoreUI.iconRefresh();
  }

  if (auth.getCurrentAccount()) {
    showSignedIn(auth.getCurrentAccount());
  }

  document.getElementById("login-tab").addEventListener("click", () => {
    document.getElementById("login-tab").classList.add("active");
    document.getElementById("register-tab").classList.remove("active");
    loginForm.hidden = false;
    registerForm.hidden = true;
    document.getElementById("account-title").innerHTML = "Đăng nhập <em>tài khoản</em>";
    document.getElementById("account-intro").textContent = "Đăng nhập để lưu món đồ yêu thích và theo dõi đơn hàng của bạn.";
  });
  document.getElementById("register-tab").addEventListener("click", () => {
    document.getElementById("register-tab").classList.add("active");
    document.getElementById("login-tab").classList.remove("active");
    registerForm.hidden = false;
    loginForm.hidden = true;
    document.getElementById("account-title").innerHTML = "Tạo tài khoản <em>Mộc</em>";
    document.getElementById("account-intro").textContent = "Chỉ mất một chút thời gian để bắt đầu.";
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage("login-message", "", false);
    try {
      const formData = new FormData(loginForm);
      const account = await auth.login({ email: formData.get("email"), password: formData.get("password") });
      showMessage("login-message", "Đăng nhập thành công. Đang chuyển trang…", true);
      if (returnPath === "account.html") showSignedIn(account);
      else window.setTimeout(() => { location.href = returnPath; }, 350);
    } catch (error) {
      showMessage("login-message", error.message || "Không thể đăng nhập. Vui lòng thử lại.", false);
    } finally {
      button.disabled = false;
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = registerForm.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage("register-message", "", false);
    const data = new FormData(registerForm);
    if (data.get("password") !== data.get("confirmPassword")) {
      showMessage("register-message", "Mật khẩu nhập lại chưa khớp.", false);
      button.disabled = false;
      return;
    }
    try {
      const account = await auth.register({ name: data.get("name"), email: data.get("email"), password: data.get("password") });
      if (returnPath === "account.html") showSignedIn(account);
      else location.href = returnPath;
    } catch (error) {
      showMessage("register-message", error.message || "Không thể tạo tài khoản. Vui lòng thử lại.", false);
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById("logout-button").addEventListener("click", () => {
    auth.logout();
    location.href = "index.html";
  });
})();
