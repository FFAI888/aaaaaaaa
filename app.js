// app.js
// 依赖: ethers.js (在 index.html 通过 CDN 引入)
const providerFallback = new ethers.providers.InfuraProvider('homestead', {
  // 无需填写 key 即可使用公共节点（速率受限）。如需稳定服务请换成自己的 Infura/Alchemy key。
});

const btnConnect = document.getElementById('btnConnect');
const btnDisconnect = document.getElementById('btnDisconnect');
const accountPanel = document.getElementById('accountPanel');
const accountAddr = document.getElementById('accountAddr');
const accountBal = document.getElementById('accountBal');
const toast = document.getElementById('toast');
const networkLabel = document.getElementById('network');

let signer = null;
let ethersProvider = null;
let currentAccount = null;

function showToast(msg, time = 3500) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> toast.classList.add('hidden'), time);
}

async function detectProvider() {
  if (window.ethereum) {
    ethersProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
    networkLabel.textContent = "检测钱包...";
    try {
      const network = await ethersProvider.getNetwork();
      networkLabel.textContent = network.name === 'homestead' ? 'Ethereum Mainnet' : network.name;
    } catch(e){ networkLabel.textContent = '网络未知' }
  } else {
    ethersProvider = providerFallback;
    networkLabel.textContent = '只读模式';
    showToast('未检测到MetaMask或钱包扩展，使用只读模式。移动端请安装或打开兼容钱包。', 5000);
  }
}

// Connect with MetaMask (or injected wallet)
async function connectWallet() {
  if (!window.ethereum) {
    showToast('未检测到注入钱包（MetaMask）。请安装后重试。');
    return;
  }

  try {
    // 请求账户权限
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    ethersProvider = new ethers.providers.Web3Provider(window.ethereum, "any");
    signer = ethersProvider.getSigner();
    currentAccount = await signer.getAddress();
    updateUIConnected(currentAccount);
    subscribeToEvents();
    showToast('已连接：' + short(currentAccount));
  } catch (err) {
    console.error(err);
    showToast('连接被拒绝或出错');
  }
}

async function disconnect() {
  // 对于注入式钱包（MetaMask），并没有真正的“断开”API，通常只在前端清理状态
  signer = null;
  currentAccount = null;
  ethersProvider = providerFallback;
  accountPanel.classList.add('hidden');
  btnConnect.classList.remove('hidden');
  btnDisconnect.classList.add('hidden');
  accountAddr.textContent = '—';
  accountBal.textContent = '—';
  networkLabel.textContent = '只读模式';
  showToast('已断开（仅前端）');
}

function short(addr) {
  if (!addr) return '—';
  return addr.slice(0,6) + '…' + addr.slice(-4);
}

async function updateUIConnected(address) {
  accountPanel.classList.remove('hidden');
  btnConnect.classList.add('hidden');
  btnDisconnect.classList.remove('hidden');
  accountAddr.textContent = short(address);

  // 获取余额并显示
  try {
    const bal = await ethersProvider.getBalance(address);
    const ether = ethers.utils.formatEther(bal);
    accountBal.textContent = Number(ether).toFixed(4) + ' ETH';
  } catch(e){
    accountBal.textContent = '无法读取';
  }

  // 网络名
  try {
    const net = await ethersProvider.getNetwork();
    networkLabel.textContent = net.name === 'homestead' ? 'Ethereum Mainnet' : net.name;
  } catch(e){}
}

// 监听账户/网络变化
function subscribeToEvents() {
  if (!window.ethereum) return;
  window.ethereum.on('accountsChanged', (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnect();
    } else {
      currentAccount = accounts[0];
      updateUIConnected(currentAccount);
      showToast('账户已切换：' + short(currentAccount));
    }
  });

  window.ethereum.on('chainChanged', (chainId) => {
    // chainId eg "0x1"
    window.location.reload();
  });
}

// 挂载按钮
btnConnect.addEventListener('click', connectWallet);
btnDisconnect.addEventListener('click', disconnect);

// 初始检测
detectProvider();

// PWA: 注册 service worker（如果支持）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registered');
    } catch (err) {
      console.warn('SW 注册失败', err);
    }
  });
}
