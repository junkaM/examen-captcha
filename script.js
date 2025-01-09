const API_URL = "https://api.prod.jcloudify.com/whoami";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const form = document.getElementById('sequence-form');
const output = document.getElementById('output');
const captchaContainer = document.getElementById('captcha-container');
const captchaDiv = document.getElementById('my-captcha-container');

let captchaResolved = false;
let stopSequence = false;


function showCaptcha() {
  AwsWafCaptcha.renderCaptcha(captchaDiv, {
    apiKey: API_KEY,
    onSuccess: captchaResolvedSuccess,
    onError: captchaResolvedError
  });
  captchaContainer.style.display = 'block';
}

function captchaResolvedSuccess(wafToken) {
  console.log("Captcha résolu avec succès");
  captchaResolved = true;
  captchaContainer.style.display = 'none';
}

function captchaResolvedError(error) {
  console.error("Erreur lors de la résolution du captcha", error);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  output.textContent = '';

  const n = parseInt(document.getElementById('number-input').value, 10);

  for (let i = 1; i <= n; i++) {
    if (stopSequence) {
      while (!captchaResolved) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      stopSequence = false;
    }

    try {
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      if (response.status === 403) {
        output.textContent += `${i}. Forbidden (403)\n`;
      } else if (response.status === 200) {
        output.textContent += `${i}. Success (200)\n`;
      } else if (response.status === 405) {
        output.textContent += `${i}. CAPTCHA Required (405)\n`;
        stopSequence = true;
        showCaptcha();
        break;
      } else {
        output.textContent += `${i}. Unexpected response: ${response.status}\n`;
      }
    } catch (error) {
      output.textContent += `${i}. Network Error: ${error.message}\n`;
      console.error(`Error on request ${i}:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});
