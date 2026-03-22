/**
 * Payment method buttons for Move Masters TX
 *
 * TODO: Replace these placeholder values with Maurice's actual accounts:
 *   - VENMO_USERNAME: His Venmo @username
 *   - CASHAPP_TAG: His CashApp $cashtag
 *   - ZELLE_PHONE_OR_EMAIL: His Zelle phone or email
 */

const PAYMENT_CONFIG = {
  venmo: {
    username: 'VENMO_USERNAME',       // TODO: Replace with actual Venmo username
    label: 'Pay with Venmo',
    color: '#008CFF',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M19.5 1.5c.9 1.5 1.3 3.1 1.3 5.1 0 6.3-5.4 14.5-9.8 20.3H3.3L.5 2.1l7.1-.7 1.8 14.3c1.7-2.8 3.8-7.1 3.8-10.1 0-1.9-.3-3.1-.8-4.1l7.1-0z"/></svg>`,
    getUrl: function(amount) {
      // venmo://paycharge opens the Venmo app directly
      // On desktop, falls back to venmo.com
      if (this.username === 'VENMO_USERNAME') return '#payment-not-configured';
      return `https://venmo.com/${this.username}?txn=pay&amount=${amount}&note=Move%20Masters%20TX%20-%20Moving%20Deposit`;
    }
  },
  cashapp: {
    tag: 'CASHAPP_TAG',              // TODO: Replace with actual CashApp $cashtag (without the $)
    label: 'Pay with Cash App',
    color: '#00D632',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M23.59 3.47A5.1 5.1 0 0 0 20.55.42 12.17 12.17 0 0 0 18 0h-6a12.17 12.17 0 0 0-2.55.42A5.1 5.1 0 0 0 6.41 3.47 12.17 12.17 0 0 0 6 6v12a12.17 12.17 0 0 0 .42 2.55 5.1 5.1 0 0 0 3.05 3.05A12.17 12.17 0 0 0 12 24h6a12.17 12.17 0 0 0 2.55-.42 5.1 5.1 0 0 0 3.05-3.05A12.17 12.17 0 0 0 24 18V6a12.17 12.17 0 0 0-.41-2.53zm-6.17 9.18l-.57.57a4.67 4.67 0 0 1-3.32 1.38 2.39 2.39 0 0 1-2.56-2.33c0-1.98 1.86-3.1 5.09-3.31v-.33c0-.71-.34-1.06-1.03-1.06a1.81 1.81 0 0 0-1.47.79l-1.9-1.41a4.41 4.41 0 0 1 3.66-1.73c2.38 0 3.7 1.18 3.7 3.41v4.02z"/></svg>`,
    getUrl: function(amount) {
      if (this.tag === 'CASHAPP_TAG') return '#payment-not-configured';
      return `https://cash.app/$${this.tag}/${amount}`;
    }
  },
  zelle: {
    recipient: 'ZELLE_PHONE_OR_EMAIL', // TODO: Replace with actual Zelle phone or email
    label: 'Pay with Zelle',
    color: '#6D1ED4',
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M13.56 1.1H4.87a.78.78 0 0 0-.72 1.07l2.2 5.43H2.11a.78.78 0 0 0-.58 1.3l12 13.74a.78.78 0 0 0 1.36-.52V13.5h4.25a.78.78 0 0 0 .58-1.3L14.28 5.6h4.04a.78.78 0 0 0 .72-1.07L16.83 0z"/></svg>`,
    getUrl: function(amount) {
      // Zelle doesn't have universal deep links — show instructions instead
      return '#zelle-instructions';
    }
  }
};

/**
 * Creates payment buttons HTML and injects it into a container
 * @param {string} containerId - ID of the container element
 * @param {number} depositAmount - The 50% deposit amount
 * @param {string} jobSummary - Brief description of the job for payment notes
 */
function renderPaymentButtons(containerId, depositAmount, jobSummary) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const formattedAmount = depositAmount.toFixed(2);
  const encodedNote = encodeURIComponent(`Move Masters TX - ${jobSummary}`);

  const html = `
    <div class="payment-methods">
      <div class="payment-methods__header">
        <h3 class="payment-methods__title">Pay Your Deposit: $${formattedAmount}</h3>
        <p class="payment-methods__subtitle">Choose your preferred payment method. Your move is confirmed once deposit is received.</p>
      </div>
      <div class="payment-methods__buttons">
        ${Object.entries(PAYMENT_CONFIG).map(([key, config]) => {
          const url = config.getUrl(formattedAmount);
          const isConfigured = !url.includes('not-configured');
          const isZelle = key === 'zelle';

          return `
            <a href="${isConfigured && !isZelle ? url : '#'}"
               class="payment-btn payment-btn--${key} ${!isConfigured ? 'payment-btn--disabled' : ''}"
               ${isConfigured && !isZelle ? 'target="_blank" rel="noopener"' : ''}
               ${isZelle && isConfigured ? `onclick="showZelleInstructions(${formattedAmount}); return false;"` : ''}
               style="background-color: ${config.color}">
              <span class="payment-btn__icon">${config.icon}</span>
              <span class="payment-btn__label">${config.label}</span>
              <span class="payment-btn__amount">$${formattedAmount}</span>
            </a>
          `;
        }).join('')}
      </div>
      <div id="zelle-instructions" class="payment-methods__zelle-info" style="display:none;">
        <div class="zelle-info-box">
          <h4>Zelle Payment Instructions</h4>
          <p>Send <strong>$${formattedAmount}</strong> via Zelle to:</p>
          <p class="zelle-recipient"><strong>${PAYMENT_CONFIG.zelle.recipient}</strong></p>
          <p>Include in the memo: <em>${jobSummary}</em></p>
          <p class="zelle-note">Open your banking app → Send Money → Zelle → enter the recipient above</p>
        </div>
      </div>
      <p class="payment-methods__footer">
        <span class="payment-methods__lock">🔒</span>
        Deposit is 50% of your quoted price. Remaining balance due on move day.
        <br>Questions? Call <a href="tel:+15125293550">(512) 529-3550</a>
      </p>
    </div>
  `;

  container.innerHTML = html;
}

function showZelleInstructions(amount) {
  const el = document.getElementById('zelle-instructions');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

// Inject payment button styles
const paymentStyles = document.createElement('style');
paymentStyles.textContent = `
  .payment-methods {
    max-width: 480px;
    margin: 0 auto;
    padding: 24px;
    text-align: center;
  }
  .payment-methods__header {
    margin-bottom: 24px;
  }
  .payment-methods__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 8px;
  }
  .payment-methods__subtitle {
    font-size: 0.95rem;
    color: #666;
    margin: 0;
  }
  .payment-methods__buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }
  .payment-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-radius: 12px;
    color: white;
    text-decoration: none;
    font-weight: 600;
    font-size: 1rem;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
    border: none;
  }
  .payment-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    color: white;
    text-decoration: none;
  }
  .payment-btn:active {
    transform: translateY(0);
  }
  .payment-btn--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
  .payment-btn__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .payment-btn__label {
    flex: 1;
    text-align: left;
  }
  .payment-btn__amount {
    font-size: 1.1rem;
    font-weight: 700;
    opacity: 0.9;
  }
  .zelle-info-box {
    background: #f3ecff;
    border: 2px solid #6D1ED4;
    border-radius: 12px;
    padding: 20px;
    margin: 16px 0;
    text-align: left;
  }
  .zelle-info-box h4 {
    color: #6D1ED4;
    margin: 0 0 12px;
  }
  .zelle-recipient {
    font-size: 1.2rem;
    background: white;
    padding: 8px 16px;
    border-radius: 8px;
    display: inline-block;
    margin: 8px 0;
  }
  .zelle-note {
    font-size: 0.85rem;
    color: #666;
    margin-top: 12px;
  }
  .payment-methods__footer {
    font-size: 0.85rem;
    color: #888;
    line-height: 1.5;
    margin-top: 16px;
  }
  .payment-methods__footer a {
    color: #1B3A5C;
    font-weight: 600;
  }
  .payment-methods__lock {
    font-size: 0.9rem;
  }
`;
document.head.appendChild(paymentStyles);
