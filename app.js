const connectWalletBtn = document.getElementById('connectWalletBtn');
const userAddressEl = document.getElementById('userAddress');
const homeAddressEl = document.getElementById('homeAddress');
const bnbBalanceEl = document.getElementById('bnbBalance');
const usdtBalanceEl = document.getElementById('usdtBalance');
const crcBalanceEl = document.getElementById('crcBalance');
const rongBalanceEl = document.getElementById('rongBalance');
const bnbValueEl = document.getElementById('bnbValue');
const usdtValueEl = document.getElementById('usdtValue');
const crcValueEl = document.getElementById('crcValue');
const rongValueEl = document.getElementById('rongValue');
const totalValueEl = document.getElementById('totalValue');
const loginPage = document.getElementById('loginPage');
const homePage = document.getElementById('homePage');
const logoutBtn = document.getElementById('logoutBtn');

let provider;
let userAccount;

// BSC 代币
const TOKEN_LIST = [
  { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
  { symbol: 'CRC', address: '0x5b2fe2b06e714b7bea4fd35b428077d850c48087', decimals: 18 },
  { symbol: 'RongChain', address: '0x0337a015467af6605c4262d9f02a3dcd8b576f7e', decimals: 18 }
];

// ERC20 ABI
const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"];

// 价格
let tokenPrices = { BNB:0, USDT:1, CRC:0.05, RongChain:0.1 };

// 连接钱包
async function connectWallet(){
  if(!window.ethereum){alert('请安装 MetaMask'); return;}
  try{
    const accounts = await ethereum.request({method:'eth_requestAccounts'});
    userAccount = accounts[0];
    provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    if(network.chainId !== 56 && network.chainId !== 97){alert('请切换到 BSC 主网或测试网'); return;}
    userAddressEl.textContent = `已连接钱包: ${userAccount}`;
    connectWalletBtn.textContent = '钱包已连接';
    connectWalletBtn.disabled = true;
    showHomePage(userAccount);

    provider.on("block", async()=>{ await updateBalances(); });
    await updateBalances();
  }catch(err){console.error(err); alert('钱包连接失败');}
}

// 显示主页
function showHomePage(account){
  loginPage.classList.add('hidden');
  homePage.classList.remove('hidden');
  homeAddressEl.textContent = `钱包地址: ${account}`;
}

// 获取价格
async function fetchPrices(){
  try{
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
    const data = await res.json();
    tokenPrices.BNB = data.binancecoin.usd;
  }catch(err){console.error('获取价格失败', err);}
}

// 更新余额和价值
async function updateBalances(){
  if(!provider || !userAccount) return;
  await fetchPrices();
  let totalUSD = 0;

  // BNB
  const bnbWei = await provider.getBalance(userAccount);
  const bnb = parseFloat(ethers.utils.formatEther(bnbWei));
  bnbBalanceEl.textContent = bnb.toFixed(4);
  const bnbUSD = bnb * tokenPrices.BNB;
  bnbValueEl.textContent = bnbUSD.toFixed(2);
  totalUSD += bnbUSD;

  // ERC20
  for(let token of TOKEN_LIST){
    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
    const balanceRaw = await contract.balanceOf(userAccount);
    const balance = parseFloat(ethers.utils.formatUnits(balanceRaw, token.decimals));
    const valueUSD = balance * tokenPrices[token.symbol];

    if(token.symbol==='USDT'){ usdtBalanceEl.textContent=balance.toFixed(4); usdtValueEl.textContent=valueUSD.toFixed(2);}
    if(token.symbol==='CRC'){ crcBalanceEl.textContent=balance.toFixed(4); crcValueEl.textContent=valueUSD.toFixed(2);}
    if(token.symbol==='RongChain'){ rongBalanceEl.textContent=balance.toFixed(4); rongValueEl.textContent=valueUSD.toFixed(2);}
    totalUSD += valueUSD;
  }

  totalValueEl.textContent = totalUSD.toFixed(2);
}

// 退出登录
function logout(){
  loginPage.classList.remove('hidden');
  homePage.classList.add('hidden');
  connectWalletBtn.disabled = false;
  connectWalletBtn.textContent = '连接钱包';
  userAddressEl.textContent='';
  bnbBalanceEl.textContent='0.0000'; bnbValueEl.textContent='0.00';
  usdtBalanceEl.textContent='0.0000'; usdtValueEl.textContent='0.00';
  crcBalanceEl.textContent='0.0000'; crcValueEl.textContent='0.00';
  rongBalanceEl.textContent='0.0000'; rongValueEl.textContent='0.00';
  totalValueEl.textContent='0.00';
  provider.removeAllListeners("block");
}

// 按钮动画
connectWalletBtn.addEventListener('click',()=>{
  connectWalletBtn.style.transform='scale(0.95)';
  setTimeout(()=>{connectWalletBtn.style.transform='scale(1)';},100);
  connectWallet();
});
logoutBtn.addEventListener('click',logout);
