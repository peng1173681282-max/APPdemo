import React, { useState, useEffect, useRef } from 'react';
import { TabType, UserProfile, Transaction, Loan, Notification } from './types';
import { getFinancialAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [loanAmount, setLoanAmount] = useState<number>(8000);
  const [loanPeriod, setLoanPeriod] = useState<number>(12);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [loanPurpose, setLoanPurpose] = useState('个人日常消费');
  const [showPurposePicker, setShowPurposePicker] = useState(false);
  const [showRepaymentPlan, setShowRepaymentPlan] = useState(false);
  
  // Selected loan for details
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  // New States for requested fields
  const [interestRate] = useState('7.2%');
  const [repaymentMethod] = useState('等额本息');
  const [bankAccount] = useState('招商银行 (8848)');

  // Welfare Center State
  const [userCoins, setUserCoins] = useState(1250);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  // Agreement Workflow State
  const [showAgreementPreview, setShowAgreementPreview] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState<string | null>(null);
  const [currentAgreementTab, setCurrentAgreementTab] = useState(0); // 0: 消金, 1: 信托, 2: 银行

  // Post-Loan States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fee Breakdown Modal State
  const [showFeeDetail, setShowFeeDetail] = useState<{principal: string, fee: string, installment: number} | null>(null);

  // Chat/Service States
  const [chatMessages, setChatMessages] = useState<{type: 'ai' | 'user', text: string}[]>([
    { type: 'ai', text: '您好，我是您的智能客服助手。关于借款流程、还款时间或提额建议，您可以随时问我。' }
  ]);
  const [isHumanService, setIsHumanService] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const [user] = useState<UserProfile>({
    name: '张先生',
    creditScore: 745,
    creditLimit: 50000,
    availableCredit: 42000,
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'n1', type: 'CreditLimit', title: '提额成功通知', message: '恭喜！您的可用额度已从 30,000 元提升至 50,000 元。', time: '10:30', isRead: false },
    { id: 'n2', type: 'Reminder', title: '还款日临近提醒', message: '温馨提示：您的本期还款日为3天后，请确保账户余额充足以免影响征信。', time: '09:15', isRead: false },
    { id: 'n3', type: 'Marketing', title: '专属利息折上折', message: '限时福利！今日借款可享受7折利息优惠，最高可省200元，立即点击查看。', time: '08:00', isRead: false },
    { id: 'n4', type: 'Reminder', title: '本期账单已出', message: '您11月份的还款账单已经生成，本月应还金额：￥856.23。', time: '昨天', isRead: true },
    { id: 'n5', type: 'Marketing', title: '会员专享：免息券到账', message: '恭喜获得一张7天免息券，已发放至您的券包中，请在有效期内使用。', time: '昨天', isRead: true },
    { id: 'n6', type: 'Success', title: '放款成功通知', message: '您的借款申请已处理完毕，资金已汇入尾号2901的银行卡中，请查收。', time: '前天', isRead: true },
    { id: 'n7', type: 'Marketing', title: '双11分期特惠', message: '双11超级分期节开启！数码家电分期至高享12期免息。', time: '前天', isRead: true },
    { id: 'n8', type: 'Reminder', title: '自动还款授权', message: '您的自动还款扣款协议将于近期到期，请及时更新授权以防逾期。', time: '3天前', isRead: true },
  ]);

  const [communityPosts] = useState([
    { 
      id: 1,
      user: '138****2190', 
      amount: '8,000', 
      time: '刚刚', 
      status: '成功下款', 
      avatar: 'fa-user-circle',
      content: '下款速度真的快，利息也合理，解决了最近家里装修的燃眉之急！',
      likes: 124,
      comments: 18,
      hasLiked: false,
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80'
    },
    { 
      id: 2,
      user: '王**', 
      amount: '12,000', 
      time: '15分钟前', 
      status: '额度生效', 
      avatar: 'fa-circle-user',
      content: '信用好果然审批快，今天刚批了12000元额度，正好给家里添置新家电。',
      likes: 56,
      comments: 4,
      hasLiked: true,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    }
  ]);

  // Simulated loan history data
  const loanHistory = [
    { id: 'L1004', date: '2024-02-15', amount: 8000, term: 12, status: '还款中', purpose: '个人日常消费', funder: '好分期消费金融', bankCard: '招商银行 (8848)', method: '等额本息' },
    { id: 'L1003', date: '2023-11-10', amount: 5000, term: 6, status: '已结清', purpose: '数码/家电消费', funder: '某某信托有限责任公司', bankCard: '建设银行 (0291)', method: '等额本金' },
    { id: 'L1002', date: '2023-05-20', amount: 12000, term: 12, status: '已结清', purpose: '装修/家具采购', funder: '某城市商业银行', bankCard: '工商银行 (5512)', method: '等额本息' },
    { id: 'L1001', date: '2022-12-01', amount: 3000, term: 3, status: '已结清', purpose: '旅游/教育培训', funder: '好分期消费金融', bankCard: '农业银行 (9921)', method: '等额本息' },
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'service') {
      scrollToBottom();
    }
  }, [chatMessages, isAiTyping, activeTab]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    
    setIsAiTyping(true);

    if (isHumanService) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { type: 'ai', text: '收到您的消息，人工客服小美正在为您核实，请稍等。' }]);
        setIsAiTyping(false);
      }, 1500);
    } else {
      const advice = await getFinancialAdvice(userMsg, `User ${user.name}, Credit limit: ${user.creditLimit}, Available: ${user.availableCredit}.`);
      setChatMessages(prev => [...prev, { type: 'ai', text: advice }]);
      setIsAiTyping(false);
    }
  };

  const switchToHuman = () => {
    if (isHumanService) return;
    setChatMessages(prev => [...prev, { type: 'ai', text: '正在为您分配人工客服，请稍候...' }]);
    setIsAiTyping(true);
    setTimeout(() => {
      setIsHumanService(true);
      setIsAiTyping(false);
      setChatMessages(prev => [...prev, { type: 'ai', text: '您好，人工客服小美已接管服务，请问有什么可以帮您的？' }]);
    }, 2000);
  };

  const hasUnread = notifications.some(n => !n.isRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleReadAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleFinalConfirm = () => {
    setShowAgreementPreview(false);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 3000);
  };

  const calculateMonthly = (amt?: number, p?: number) => {
    const amount = amt || loanAmount;
    const period = p || loanPeriod;
    return (amount / period + (amount * 0.000666)).toFixed(2);
  };

  const handleAmountChange = (val: number) => {
    const rounded = Math.round(val / 100) * 100;
    setLoanAmount(Math.min(Math.max(rounded, 1000), 50000));
  };

  const handleDailyCheckIn = () => {
    if (dailyClaimed) return;
    setUserCoins(prev => prev + 50);
    setDailyClaimed(true);
  };

  const renderHome = () => (
    <div className="pb-24 animate-in fade-in duration-300">
      <header className="bg-white px-4 pt-6 pb-2 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"><i className="fas fa-coins text-sm"></i></div>
          <div><h1 className="text-lg font-bold leading-none">好分期</h1><p className="text-[10px] text-gray-400 mt-1">正规持牌消费金融机构</p></div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('service')} 
            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full transition-all active:scale-90 shadow-lg shadow-blue-100 border-2 border-white ring-2 ring-blue-50"
          >
            <i className="fas fa-headset text-lg"></i>
          </button>
          <div className="relative cursor-pointer p-1 text-gray-600" onClick={() => setActiveTab('notifications')}>
            <i className="far fa-bell text-2xl"></i>
            {hasUnread && <span className="badge-red">{unreadCount}</span>}
          </div>
        </div>
      </header>

      <div className="px-4 mt-2">
        <div className="anyihua-card quota-gradient p-8 flex flex-col items-center">
          <div className="flex items-center text-gray-600 text-sm mb-4">可用额度(元) <i className="fas fa-chevron-right text-[10px] ml-1"></i></div>
          <div className="amount-font text-[56px] text-[#333] leading-none mb-4 tracking-tighter">{user.availableCredit.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mb-8 font-medium">总额度{user.creditLimit.toLocaleString()}.00</div>
          <button onClick={() => setActiveTab('apply')} className="w-full py-4 btn-anyihua text-lg shadow-lg shadow-blue-100 transition-transform active:scale-95">立即提现</button>
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-4 gap-y-6 bg-white py-6 rounded-2xl">
        {[
          { label: '借款', icon: 'fa-user-tag', color: 'bg-blue-100 text-blue-600', tab: 'apply' },
          { label: '还款', icon: 'fa-wallet', color: 'bg-teal-100 text-teal-600', tab: 'loans' },
          { label: '提额', icon: 'fa-arrow-up-right-dots', color: 'bg-blue-50 text-blue-500', tab: 'increase-limit' },
          { label: '福利中心', icon: 'fa-gift', color: 'bg-red-50 text-red-500', tab: 'welfare-center' },
          { label: '优惠券', icon: 'fa-ticket-simple', color: 'bg-orange-100 text-orange-600', tab: 'coupons' },
          { label: '看短剧', icon: 'fa-circle-play', color: 'bg-purple-50 text-purple-600', tab: 'short-drama' },
          { label: '看小说', icon: 'fa-book-open', color: 'bg-amber-50 text-amber-600' },
          { label: '更多', icon: 'fa-ellipsis', color: 'bg-gray-100 text-gray-500' },
        ].map((item, i) => (
          <div key={i} onClick={() => item.tab && setActiveTab(item.tab as TabType)} className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${item.color}`}><i className={`fas ${item.icon}`}></i></div>
            <span className="text-[11px] text-gray-600 font-bold">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl p-3 flex items-center gap-3 overflow-hidden border border-gray-50 shadow-sm">
          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded italic font-bold shrink-0 z-10">实时</span>
          <div className="marquee-container"><p className="marquee-text text-xs text-gray-500">恭喜 185****1209 提现成功 5000 元 | 恭喜 133****9911 获得授信额度 20000 元</p></div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">社区晒单</h3>
          <div className="text-[11px] text-gray-400 flex items-center gap-1">更多发现 <i className="fas fa-chevron-right text-[8px]"></i></div>
        </div>
        <div className="space-y-4">
          {communityPosts.map(post => (
            <div key={post.id} className="anyihua-card overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-300">
                      <i className={`fas ${post.avatar} text-2xl`}></i>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-gray-800">{post.user}</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2">
                        <span>{post.time}</span>
                        <span className="text-blue-500 font-medium">#{post.status}#</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-blue-600 amount-font">¥{post.amount}</div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">{post.content}</p>
                <div className="rounded-xl overflow-hidden aspect-[16/9] mb-4">
                  <img src={post.image} className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLoans = () => {
    const currentDue = 0;
    const remainingUnpaid = loanAmount; 
    const monthlyAmount = calculateMonthly();

    return (
      <div className="pb-24 animate-in fade-in duration-300 min-h-screen bg-white relative">
        <header className="bg-white px-4 pt-6 pb-2 flex items-center gap-4 sticky top-0 z-20">
          <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center text-gray-600 active:scale-90 transition-transform">
            <i className="fas fa-chevron-left text-lg"></i>
          </button>
          <h1 className="text-xl font-bold">还款中心</h1>
        </header>

        {/* Total Unpaid Card */}
        <div className="px-4 mt-4">
          <div className="anyihua-card bg-gradient-to-br from-blue-600 to-blue-500 p-8 flex flex-col items-center text-white overflow-hidden relative shadow-xl shadow-blue-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <p className="text-white/70 text-xs mb-3 font-medium uppercase tracking-widest">剩余未还总额 (元)</p>
            <div className="amount-font text-5xl leading-none mb-6 tracking-tight">
              {remainingUnpaid.toLocaleString()}.00
            </div>
            <div className="flex w-full justify-around border-t border-white/10 pt-6">
              <div className="text-center">
                <p className="text-white/60 text-[10px] mb-1">分期期数</p>
                <p className="text-white text-xs font-bold">{loanPeriod}期</p>
              </div>
              <div className="text-center border-l border-white/10 pl-8">
                <p className="text-white/60 text-[10px] mb-1">可用额度</p>
                <p className="text-white text-xs font-bold">¥{user.availableCredit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Feature: Loan & Repayment Record Buttons */}
        <div className="px-4 mt-6 grid grid-cols-2 gap-4">
          <button 
            onClick={() => setActiveTab('loan-records')}
            className="flex items-center justify-center gap-3 bg-white border border-gray-100 py-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all"
          >
             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <i className="fas fa-file-invoice-dollar text-sm"></i>
             </div>
             <span className="text-sm font-bold text-gray-700">借款记录</span>
          </button>
          <button className="flex items-center justify-center gap-3 bg-white border border-gray-100 py-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all">
             <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <i className="fas fa-history text-sm"></i>
             </div>
             <span className="text-sm font-bold text-gray-700">还款记录</span>
          </button>
        </div>

        {/* Current Due Section */}
        <div className="px-4 mt-8">
          <div className="flex justify-between items-end mb-4">
             <div>
               <h3 className="font-bold text-gray-800 text-base">本期应还</h3>
               <p className="text-[10px] text-gray-400 mt-0.5">暂无已出账单</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-gray-400 mb-0.5">下个还款日</p>
                <span className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full">10天后</span>
             </div>
          </div>
          
          <div className="anyihua-card p-6 border border-gray-50 flex flex-col gap-6">
             <div className="flex justify-between items-center">
                <div className="flex items-baseline gap-1">
                   <span className="text-sm font-bold text-gray-400 amount-font">¥</span>
                   <span className="text-3xl font-bold text-gray-400 amount-font">{currentDue.toFixed(2)}</span>
                </div>
                <button className="px-6 py-2.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-full cursor-not-allowed">暂无欠款</button>
             </div>
             
             <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                <i className="fas fa-circle-check text-blue-500 text-sm mt-0.5"></i>
                <div>
                   <p className="text-xs font-bold text-gray-700">您目前没有逾期欠款</p>
                   <p className="text-[10px] text-gray-400 mt-1">请保持良好的还款习惯，维护个人征信。</p>
                </div>
             </div>
          </div>
        </div>

        {/* Upcoming Repayment Plan Section */}
        <div className="px-4 mt-10 pb-10">
           <div className="flex justify-between items-center mb-5">
             <h3 className="font-bold text-gray-800 text-sm">未来3个月还款计划</h3>
             <button 
               onClick={() => setShowRepaymentPlan(true)}
               className="text-[11px] text-blue-500 font-bold flex items-center gap-1 active:opacity-60"
             >
                查看更多期次 <i className="fas fa-chevron-right text-[8px]"></i>
             </button>
           </div>
           
           <div className="space-y-3">
              {[1, 2, 3].map(i => {
                const date = new Date();
                date.setMonth(date.getMonth() + i);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-15`;
                const principal = (loanAmount / loanPeriod).toFixed(2);
                const fee = (loanAmount * 0.000666).toFixed(2);
                
                return (
                  <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all active:bg-gray-50">
                     <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                           <i className="fas fa-calendar-alt text-sm"></i>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-gray-800">第 {i} 期应还</p>
                           <p className="text-[10px] text-gray-400">预期还款日：{dateStr}</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => setShowFeeDetail({ principal, fee, installment: i })}
                       className="text-right group"
                     >
                        <p className="text-xs font-bold text-gray-800 amount-font group-active:text-blue-500 transition-colors">¥{monthlyAmount}</p>
                        <p className="text-[9px] text-blue-400 font-bold flex items-center justify-end gap-1">待出账 <i className="fas fa-info-circle text-[8px]"></i></p>
                     </button>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Fee Detail Modal */}
        {showFeeDetail && (
          <div className="fixed inset-0 bg-black/40 z-[350] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-300">
               <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-gray-800 text-lg">第 {showFeeDetail.installment} 期费项明细</h4>
                  <button onClick={() => setShowFeeDetail(null)} className="text-gray-300 active:text-gray-500"><i className="fas fa-times-circle text-xl"></i></button>
               </div>
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                     <span className="text-gray-400 text-xs font-medium">应还本金</span>
                     <span className="text-gray-800 font-bold text-sm amount-font">¥{showFeeDetail.principal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-gray-400 text-xs font-medium">应还息费</span>
                     <span className="text-gray-800 font-bold text-sm amount-font">¥{showFeeDetail.fee}</span>
                  </div>
                  <div className="h-px bg-gray-50"></div>
                  <div className="flex justify-between items-center">
                     <span className="text-gray-800 font-bold text-xs">合计</span>
                     <span className="text-blue-600 font-bold text-lg amount-font">¥{(Number(showFeeDetail.principal) + Number(showFeeDetail.fee)).toFixed(2)}</span>
                  </div>
               </div>
               <button onClick={() => setShowFeeDetail(null)} className="w-full py-3 bg-blue-600 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-100">关闭</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLoanRecords = () => (
    <div className="pb-24 pt-6 px-4 animate-in slide-in-from-right duration-300 min-h-screen bg-white">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveTab('loans')} className="w-8 h-8 flex items-center justify-center text-gray-600 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left text-lg"></i>
        </button>
        <h1 className="text-xl font-bold text-gray-800">借款记录</h1>
      </header>

      <div className="space-y-4">
        {loanHistory.map(record => (
          <div 
            key={record.id} 
            onClick={() => { setSelectedLoan(record); setActiveTab('loan-details'); }}
            className="anyihua-card p-5 border border-gray-50 hover:border-blue-100 transition-all active:scale-[0.99] cursor-pointer"
          >
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-[13px] font-bold text-gray-800 mb-0.5">{record.purpose}</h3>
                   <p className="text-[10px] text-gray-400 font-medium">借款单号: {record.id}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${record.status === '已结清' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-500'}`}>
                   {record.status}
                </span>
             </div>
             
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] text-gray-400 mb-1">借款时间</p>
                   <p className="text-xs font-bold text-gray-700">{record.date}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] text-gray-400 mb-1">借款期限</p>
                   <p className="text-xs font-bold text-gray-700">{record.term}期</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-gray-400 mb-1">借款金额</p>
                   <p className="text-xl font-bold text-blue-600 amount-font">¥{record.amount.toLocaleString()}</p>
                </div>
             </div>
             
             {record.status === '还款中' && (
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-blue-500 font-bold">本期账单生成中</span>
                   </div>
                   <div className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                      详情 <i className="fas fa-chevron-right text-[8px]"></i>
                   </div>
                </div>
             )}
          </div>
        ))}
      </div>
      
      <div className="py-12 text-center">
          <p className="text-xs text-gray-300 font-medium">— 仅展示您的借款历史记录 —</p>
      </div>
    </div>
  );

  const renderLoanDetails = () => {
    if (!selectedLoan) return null;
    const monthly = calculateMonthly(selectedLoan.amount, selectedLoan.term);
    
    return (
      <div className="pb-24 pt-6 px-4 animate-in slide-in-from-right duration-300 min-h-screen bg-white">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setActiveTab('loan-records')} className="w-8 h-8 flex items-center justify-center text-gray-600 active:scale-90 transition-transform">
            <i className="fas fa-chevron-left text-lg"></i>
          </button>
          <h1 className="text-xl font-bold text-gray-800">借款详情</h1>
        </header>

        {/* Amount & Status Card */}
        <div className="anyihua-card p-8 flex flex-col items-center border border-gray-50 mb-6 bg-gradient-to-b from-blue-50/20 to-white">
           <p className="text-gray-400 text-[11px] font-bold uppercase mb-2 tracking-widest">借款金额 (元)</p>
           <div className="amount-font text-[48px] text-blue-600 leading-none mb-4 tracking-tighter">¥{selectedLoan.amount.toLocaleString()}.00</div>
           <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${selectedLoan.status === '已结清' ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white'}`}>
             {selectedLoan.status}
           </span>
        </div>

        {/* Detailed Info Groups (Randomized feel but organized) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-[#F9FBFF] p-4 rounded-2xl border border-blue-50/50">
              <p className="text-[10px] text-gray-400 mb-1">借款单号</p>
              <p className="text-xs font-bold text-gray-700">{selectedLoan.id}</p>
           </div>
           <div className="bg-[#F9FBFF] p-4 rounded-2xl border border-blue-50/50">
              <p className="text-[10px] text-gray-400 mb-1">借款日期</p>
              <p className="text-xs font-bold text-gray-700">{selectedLoan.date}</p>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden mb-6">
           <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
              <span className="text-gray-400 text-xs">出资方</span>
              <span className="text-gray-800 font-bold text-xs">{selectedLoan.funder}</span>
           </div>
           <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
              <span className="text-gray-400 text-xs">收款账户</span>
              <span className="text-gray-800 font-bold text-xs">{selectedLoan.bankCard}</span>
           </div>
           <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
              <span className="text-gray-400 text-xs">期数 / 还款方式</span>
              <span className="text-gray-800 font-bold text-xs">{selectedLoan.term}期 / {selectedLoan.method}</span>
           </div>
           <div className="px-5 py-4 flex justify-between items-center">
              <span className="text-gray-400 text-xs">单期应还</span>
              <span className="text-blue-600 font-bold text-xs amount-font">¥{monthly}</span>
           </div>
        </div>

        {/* Inner Loan Repayment Plan */}
        <div className="mt-8">
           <h3 className="font-bold text-gray-800 text-sm mb-4">借据还款计划</h3>
           <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
              {Array.from({ length: selectedLoan.term }).map((_, i) => {
                const date = new Date(selectedLoan.date);
                date.setMonth(date.getMonth() + i + 1);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                
                return (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-gray-50/50 border border-gray-50">
                     <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-700">{i + 1}/{selectedLoan.term}期</span>
                        <span className="text-[9px] text-gray-400">预计还款日 {dateStr}</span>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-gray-800 amount-font">¥{monthly}</p>
                        <span className={`text-[9px] font-bold ${selectedLoan.status === '已结清' ? 'text-gray-300 line-through' : 'text-blue-400'}`}>
                           {selectedLoan.status === '已结清' ? '已还款' : '待出账'}
                        </span>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>

        <div className="py-12 text-center">
            <p className="text-xs text-gray-300 font-medium">— 借据相关文件请查看电子合同 —</p>
        </div>
      </div>
    );
  };

  const renderIncreaseLimit = () => (
    <div className="pb-24 pt-6 px-4 animate-in slide-in-from-right duration-300 min-h-screen bg-white">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center text-gray-600 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left text-lg"></i>
        </button>
        <h1 className="text-xl font-bold text-gray-800">提额中心</h1>
      </header>

      {/* Current Limit Card */}
      <div className="anyihua-card bg-gradient-to-br from-[#0076FF] to-[#4096ff] p-8 flex flex-col items-center text-white mb-8 shadow-xl shadow-blue-100">
         <p className="text-white/70 text-[11px] mb-2 font-medium">当前总额度 (元)</p>
         <div className="amount-font text-[44px] leading-none mb-6">{user.creditLimit.toLocaleString()}</div>
         <p className="text-white/60 text-[10px] mb-4 text-center">分期借款，按时还款有助于提升额度</p>
         <button onClick={() => setActiveTab('apply')} className="w-full py-3.5 bg-white text-blue-600 rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform">立即借款</button>
      </div>

      {/* Supplement Info Section */}
      <div className="mb-10">
         <h3 className="font-bold text-gray-800 text-base mb-4">资料补充提额</h3>
         <div className="anyihua-card p-5 border border-blue-50 flex items-center justify-between bg-blue-50/20">
            <div className="flex items-center gap-4">
               <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl">
                  <i className="fas fa-building-user"></i>
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-800">公积金提额</p>
                  <p className="text-[10px] text-gray-500 mt-1">最高可提 10,000 元</p>
               </div>
            </div>
            <button className="px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-bold active:scale-95 transition-transform">去补充</button>
         </div>
      </div>

      {/* Limit Tips Section */}
      <div>
         <h3 className="font-bold text-gray-800 text-base mb-4">提额小妙招</h3>
         <div className="space-y-4">
            {[
               { icon: 'fa-bell', label: '开通APP通知权限', desc: '及时获取提额及优惠动态', color: 'bg-orange-50 text-orange-500' },
               { icon: 'fa-star', label: '应用商店五星好评', desc: '您的肯定是我们前进的动力', color: 'bg-yellow-50 text-yellow-500' },
               { icon: 'fa-comments', label: '关注官方公众号', desc: '获取最新活动与提额资讯', color: 'bg-green-50 text-green-500' },
            ].map((trick, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-50 shadow-sm active:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 ${trick.color} rounded-xl flex items-center justify-center text-lg`}>
                        <i className={`fas ${trick.icon}`}></i>
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-gray-800">{trick.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{trick.desc}</p>
                     </div>
                  </div>
                  <i className="fas fa-chevron-right text-[10px] text-gray-300"></i>
               </div>
            ))}
         </div>
      </div>

      <div className="py-12 text-center">
          <p className="text-[10px] text-gray-300 font-medium italic">温馨提示：最终额度以系统审批为准</p>
      </div>
    </div>
  );

  const renderWelfareCenter = () => (
    <div className="pb-24 pt-6 px-4 animate-in slide-in-from-right duration-300 min-h-screen bg-white">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center text-gray-600 active:scale-90 transition-transform">
            <i className="fas fa-chevron-left text-lg"></i>
          </button>
          <h1 className="text-xl font-bold text-gray-800">福利中心</h1>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
           <i className="fas fa-coins text-orange-400 text-sm"></i>
           <span className="text-sm font-bold text-orange-600 amount-font">{userCoins}</span>
        </div>
      </header>

      {/* Main Banner / Check-in */}
      <div className="anyihua-card bg-gradient-to-br from-[#FF9D00] to-[#FF6B00] p-6 text-white mb-8 overflow-hidden relative shadow-xl shadow-orange-100">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
         <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">每日签到领金币</h3>
            <p className="text-white/80 text-[10px] mb-6">连续签到7天，更有大额免息券相送</p>
            <div className="grid grid-cols-7 gap-1.5 mb-6">
               {[10, 20, 30, 40, 50, 60, 100].map((val, i) => (
                 <div key={i} className={`flex flex-col items-center p-2 rounded-xl border ${i === 0 || dailyClaimed ? 'bg-white/20 border-white/20' : 'bg-white/10 border-white/10'}`}>
                    <span className="text-[9px] mb-1 opacity-70">Day {i+1}</span>
                    <i className="fas fa-coins text-[10px] mb-1 text-yellow-300"></i>
                    <span className="text-[10px] font-bold">+{val}</span>
                 </div>
               ))}
            </div>
            <button 
              onClick={handleDailyCheckIn}
              disabled={dailyClaimed}
              className={`w-full py-3.5 rounded-full font-bold text-sm shadow-lg transition-all active:scale-95 ${dailyClaimed ? 'bg-white/20 text-white/50 cursor-not-allowed' : 'bg-white text-orange-600'}`}
            >
              {dailyClaimed ? '今日已签到' : '立即签到'}
            </button>
         </div>
      </div>

      {/* Game Section */}
      <div className="mb-10">
         <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-800 text-base">游戏赚金币</h3>
            <span className="text-[11px] text-gray-400">更多好玩 <i className="fas fa-chevron-right text-[8px]"></i></span>
         </div>
         <div className="grid grid-cols-2 gap-4">
            {[
               { name: '欢乐大转盘', icon: 'fa-dharmachakra', color: 'bg-red-50 text-red-500', prize: '最高888金币' },
               { name: '金豆消消乐', icon: 'fa-puzzle-piece', color: 'bg-purple-50 text-purple-500', prize: '每日赢取免息券' },
               { name: '幸运翻翻乐', icon: 'fa-layer-group', color: 'bg-blue-50 text-blue-500', prize: '抽万元提额包' },
               { name: '答题赢好礼', icon: 'fa-lightbulb', color: 'bg-yellow-50 text-yellow-500', prize: '闯关瓜分百万金币' },
            ].map((game, i) => (
               <div key={i} className="anyihua-card p-4 border border-gray-50 hover:border-orange-200 transition-all active:scale-[0.98] flex flex-col items-center text-center">
                  <div className={`w-12 h-12 ${game.color} rounded-2xl flex items-center justify-center text-2xl mb-3`}>
                     <i className={`fas ${game.icon}`}></i>
                  </div>
                  <p className="text-xs font-bold text-gray-800 mb-1">{game.name}</p>
                  <p className="text-[9px] text-orange-500 font-medium">{game.prize}</p>
               </div>
            ))}
         </div>
      </div>

      {/* Task List Section */}
      <div>
         <h3 className="font-bold text-gray-800 text-base mb-4">更多福利任务</h3>
         <div className="space-y-3">
            {[
               { label: '完善个人基础资料', prize: '200金币', icon: 'fa-id-card', color: 'text-blue-500', bg: 'bg-blue-50' },
               { label: '邀请好友首借成功', prize: '1000金币', icon: 'fa-user-plus', color: 'text-emerald-500', bg: 'bg-emerald-50' },
               { label: '观看金融知识小短片', prize: '30金币', icon: 'fa-video', color: 'text-orange-500', bg: 'bg-orange-50' },
            ].map((task, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-50 shadow-sm active:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 ${task.bg} ${task.color} rounded-xl flex items-center justify-center text-lg`}>
                        <i className={`fas ${task.icon}`}></i>
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-gray-800">{task.label}</p>
                        <p className="text-[10px] text-orange-500 font-bold mt-0.5">奖励：{task.prize}</p>
                     </div>
                  </div>
                  <button className="px-4 py-1.5 border border-blue-600 text-blue-600 text-[10px] font-bold rounded-full active:bg-blue-600 active:text-white transition-all">去完成</button>
               </div>
            ))}
         </div>
      </div>

      <div className="py-12 text-center">
          <p className="text-[10px] text-gray-300 font-medium">金币可用于兑换免息券、提额包等精美好礼</p>
      </div>
    </div>
  );

  const renderCoupons = () => (
    <div className="pb-24 pt-6 px-4 animate-in slide-in-from-right duration-300 min-h-screen bg-[#0A0D14]">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
          <i className="fas fa-chevron-left text-lg"></i>
        </button>
        <h1 className="text-xl font-bold text-white">优惠与会员</h1>
      </header>

      {/* High-End Membership Tiers Section */}
      <div className="mb-10">
         <div className="flex justify-between items-end mb-5">
           <h3 className="font-bold text-white text-base">会员权益订阅</h3>
           <span className="text-[10px] text-gray-500 tracking-wider">专享极致省钱方案</span>
         </div>
         
         <div className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide snap-x px-1">
            {[
               { 
                 price: '9.9', 
                 label: '铜牌体验', 
                 period: '30天', 
                 tag: '入门首选',
                 gradient: 'from-[#432314] via-[#7D4C33] to-[#432314]',
                 borderColor: 'border-[#7D4C33]/30',
                 iconColor: 'text-[#CD7F32]',
                 perks: ['5元利息抵扣券 x 2', '提额优先审批', '金币加成 5%'] 
               },
               { 
                 price: '39.9', 
                 label: '铂金高级', 
                 period: '90天', 
                 tag: '超值推荐',
                 gradient: 'from-[#1E272E] via-[#485460] to-[#1E272E]',
                 borderColor: 'border-white/10',
                 iconColor: 'text-blue-300',
                 isFeatured: true,
                 perks: ['20元利息抵扣券 x 3', '逾期费减免机会 x 1', '金币加成 15%', '专属客服绿色通道'] 
               },
               { 
                 price: '98', 
                 label: '至尊黑金', 
                 period: '365天', 
                 tag: '尊贵身份',
                 gradient: 'from-[#1A1A1A] via-[#2A2A2A] to-[#000000]',
                 borderColor: 'border-[#D4AF37]/40',
                 iconColor: 'text-[#D4AF37]',
                 perks: ['50元利息抵扣券 x 5', '利息终身95折', '大额提额礼包', '金币加成 30%', '生日专属神秘礼'] 
               },
            ].map((tier, i) => (
               <div 
                 key={i} 
                 className={`snap-center min-w-[280px] rounded-[2.5rem] bg-gradient-to-br ${tier.gradient} p-[1px] ${tier.isFeatured ? 'ring-2 ring-blue-500/20' : ''} shadow-2xl relative overflow-hidden`}
               >
                  <div className={`bg-transparent backdrop-blur-3xl rounded-[2.4rem] p-7 h-full flex flex-col border ${tier.borderColor}`}>
                    {/* Tier Tag */}
                    <div className="absolute top-4 right-6">
                       <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter bg-white/5 border border-white/10 ${tier.iconColor}`}>
                         {tier.tag}
                       </span>
                    </div>

                    <div className="mb-8 mt-2">
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-3">{tier.label}</p>
                       <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-medium ${tier.iconColor}`}>¥</span>
                          <span className="text-4xl font-bold amount-font text-white">{tier.price}</span>
                          <span className="text-[10px] text-gray-500 ml-1 font-bold">/ {tier.period}</span>
                       </div>
                    </div>

                    <div className="flex-1 space-y-4 mb-10">
                       {tier.perks.map((perk, j) => (
                          <div key={j} className="flex items-start gap-3">
                             <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-white/5 ${tier.iconColor}`}>
                               <i className="fas fa-check text-[8px]"></i>
                             </div>
                             <span className="text-[11px] text-gray-300 font-medium leading-tight">{perk}</span>
                          </div>
                       ))}
                    </div>

                    <button className={`w-full py-4 rounded-2xl text-[13px] font-bold transition-all active:scale-95 shadow-lg ${tier.isFeatured ? 'bg-blue-600 text-white shadow-blue-900/40' : i === 2 ? 'bg-[#D4AF37] text-black shadow-yellow-900/20' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                       立即开通
                    </button>
                  </div>
                  
                  {/* Premium Texture Overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
               </div>
            ))}
         </div>
      </div>

      {/* Coupon List Section - Dark Mode UI */}
      <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5">
         <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="font-bold text-white text-base">专属领券中心</h3>
            <span className="text-[11px] text-blue-400 font-bold">我的券包</span>
         </div>
         
         <div className="space-y-4">
            {[
               { title: '7天免息特权', desc: '限尊享会员领取使用', value: 'FREE', type: '无息', color: 'text-orange-400', bg: 'bg-orange-400/10' },
               { title: '大额利息折扣', desc: '满5000元分期立享', value: '8.5折', type: '会员专属', color: 'text-blue-400', bg: 'bg-blue-400/10' },
               { title: '息费立减特惠', desc: '还款时自动抵扣', value: '50元', type: '现金抵扣', color: 'text-rose-400', bg: 'bg-rose-400/10' },
            ].map((coupon, i) => (
               <div key={i} className="flex bg-[#12161F] rounded-[1.8rem] overflow-hidden border border-white/5 group active:scale-[0.98] transition-all">
                  <div className={`w-24 shrink-0 ${coupon.bg} flex flex-col items-center justify-center p-4 border-r border-dashed border-white/10`}>
                     <span className={`text-xl font-bold amount-font ${coupon.color}`}>{coupon.value}</span>
                     <span className={`text-[8px] font-black ${coupon.color} uppercase mt-1 tracking-widest`}>{coupon.type}</span>
                  </div>
                  <div className="flex-1 p-5 flex items-center justify-between">
                     <div>
                        <p className="text-[13px] font-bold text-gray-200">{coupon.title}</p>
                        <p className="text-[10px] text-gray-500 mt-1 font-medium">{coupon.desc}</p>
                     </div>
                     <button className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold rounded-full transition-colors">领取</button>
                  </div>
               </div>
            ))}
         </div>
      </div>

      <div className="py-12 text-center">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em]">HaoFenQi Premium Membership Service</p>
      </div>
    </div>
  );

  const renderShortDrama = () => (
    <div className="pb-24 pt-6 px-4 animate-in slide-in-from-right duration-300 min-h-screen bg-[#0F0F1A]">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
            <i className="fas fa-chevron-left text-lg"></i>
          </button>
          <h1 className="text-xl font-bold text-white">热门短剧</h1>
        </div>
        <div className="flex items-center gap-2 bg-purple-900/30 px-3 py-1.5 rounded-full border border-purple-500/30">
           <i className="fas fa-bolt text-yellow-400 text-xs"></i>
           <span className="text-[10px] font-bold text-purple-300">今日更新 12 部</span>
        </div>
      </header>

      {/* Drama List */}
      <div className="space-y-6">
        {[
          { 
            title: '龙王归来之赘婿称霸', 
            desc: '隐忍三年的龙王赘婿，因五百块彩礼被逐，如今真实身份揭开，全城大佬下跪...', 
            views: '4,521.8万', 
            episodes: '100集全',
            image: 'https://images.unsplash.com/photo-1598899139739-c445f1c4c99a?w=600&auto=format&fit=crop&q=80',
            hot: true 
          },
          { 
            title: '亿万富翁的马甲又掉了', 
            desc: '为了躲避联姻，我隐藏亿万家产当外卖员，结果闪婚的老婆竟是我的死对头总裁？', 
            views: '2,109.4万', 
            episodes: '88集',
            image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80'
          },
          { 
            title: '重回1990当首富', 
            desc: '商界传奇意外重生，带着未来的经济记忆，他能否在乱世中拯救妻儿，问鼎巅峰？', 
            views: '895.2万', 
            episodes: '120集',
            image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80'
          },
          { 
            title: '绝世天医：开局退婚九个女神', 
            desc: '被师父赶下山，手里拿着九张婚书。我是救人如神的医，也是杀人不眨眼的魔。', 
            views: '3,342.1万', 
            episodes: '95集',
            image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&auto=format&fit=crop&q=80',
            hot: true
          },
          { 
            title: '战神降临：我那八个绝色姐姐', 
            desc: '在边疆浴血八年的战神凯旋，才发现家里竟有八个倾国倾城的亲姐姐在等他宠溺？', 
            views: '1,248.6万', 
            episodes: '105集',
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop&q=80'
          }
        ].map((drama, i) => (
          <div key={i} className="group bg-[#1A1A2E] rounded-3xl overflow-hidden border border-white/5 active:scale-[0.98] transition-all">
            <div className="relative aspect-[21/9] overflow-hidden">
               <img src={drama.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] to-transparent"></div>
               {drama.hot && (
                 <div className="absolute top-4 left-4 flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg">
                    <i className="fas fa-fire"></i> 全网爆火
                 </div>
               )}
               <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10">
                  {drama.episodes}
               </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-base font-bold text-gray-100 flex-1 pr-2">{drama.title}</h3>
                 <div className="flex items-center gap-1.5 text-purple-400">
                    <i className="fas fa-play text-[10px]"></i>
                    <span className="text-[11px] font-black">{drama.views}</span>
                 </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{drama.desc}</p>
              <div className="mt-5 flex gap-3">
                 <button className="flex-1 py-3 bg-purple-600 text-white text-xs font-bold rounded-2xl active:bg-purple-700 transition-colors">立即观看</button>
                 <button className="w-12 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 active:bg-white/10">
                    <i className="far fa-heart"></i>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="py-12 text-center">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">— 精彩好剧 持续更新中 —</p>
      </div>
    </div>
  );

  const renderApply = () => (
    <div className="pb-40 pt-6 px-4 animate-in slide-in-from-right duration-300 bg-white min-h-screen">
      <div className="flex items-center gap-2 mb-8">
        <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center text-gray-600">
          <i className="fas fa-chevron-left text-lg"></i>
        </button>
        <h1 className="text-xl font-bold">借款申请</h1>
      </div>

      {/* Amount Input & Slider Section */}
      <div className="mb-8">
        <p className="text-gray-400 text-xs mb-4 text-center">借款金额 (元)</p>
        <div className="flex justify-center items-center gap-1 mb-8">
          <div className="bg-blue-50/50 border border-blue-100/50 px-6 py-3 rounded-2xl flex items-center gap-1 shadow-inner">
            <span className="text-2xl font-bold text-blue-600 amount-font">￥</span>
            <input 
              type="number"
              value={loanAmount}
              onBlur={(e) => handleAmountChange(Number(e.target.value))}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="text-4xl font-bold amount-font text-blue-600 w-44 bg-transparent text-center border-none focus:ring-0 outline-none"
            />
          </div>
        </div>
        <div className="px-2">
            <input 
            type="range" 
            min="1000" 
            max="50000" 
            step="100" 
            value={loanAmount} 
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
            <span>1,000</span>
            <span>50,000</span>
            </div>
            <p className="text-center text-[10px] text-blue-400/80 mt-2 font-medium italic">温馨提示：申请金额需为100的倍数</p>
        </div>
      </div>

      {/* Period Selection - Moved Above Detail List */}
      <div className="mb-6">
        <p className="text-gray-800 text-sm font-bold mb-4">借款期限</p>
        <div className="grid grid-cols-4 gap-3">
          {[3, 6, 12, 24].map(period => (
            <button 
              key={period}
              onClick={() => setLoanPeriod(period)}
              className={`py-3 rounded-xl border-2 font-bold transition-all text-xs ${loanPeriod === period ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-gray-100 text-gray-500'}`}
            >
              {period}期
            </button>
          ))}
        </div>
      </div>

      {/* Detail List */}
      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden mb-8">
        <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
          <span className="text-gray-500 text-sm">利率</span>
          <span className="text-gray-800 font-bold text-sm">{interestRate}</span>
        </div>
        <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
          <span className="text-gray-500 text-sm">还款方式</span>
          <span className="text-gray-800 font-bold text-sm">{repaymentMethod}</span>
        </div>
        <div 
          className="px-5 py-4 flex justify-between items-center border-b border-gray-50 cursor-pointer active:bg-gray-50 transition-colors"
          onClick={() => setShowRepaymentPlan(true)}
        >
          <span className="text-gray-500 text-sm">预计月还款</span>
          <div className="flex items-center gap-1">
            <span className="text-blue-600 font-bold text-sm">￥{calculateMonthly()}</span>
            <i className="fas fa-chevron-right text-[10px] text-blue-200"></i>
          </div>
        </div>
        <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
          <span className="text-gray-500 text-sm">收款账户</span>
          <span className="text-gray-800 font-bold text-sm">{bankAccount}</span>
        </div>
        <div 
          className="px-5 py-4 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
          onClick={() => setShowPurposePicker(true)}
        >
          <span className="text-gray-500 text-sm">借款用途</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-800 font-bold text-sm">{loanPurpose}</span>
            <i className="fas fa-chevron-right text-[10px] text-gray-300"></i>
          </div>
        </div>
      </div>

      {/* Footer Actions - Aligned with App Width */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 p-5 pb-8 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-start gap-3 mb-4 px-1">
          <input 
            type="checkbox" 
            checked={agreementChecked} 
            onChange={(e) => setAgreementChecked(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <label className="text-[11px] text-gray-400 leading-tight">
            我已阅读并同意签署 
            <span 
              onClick={(e) => { e.preventDefault(); setViewingAgreement('征信授权协议'); }}
              className="text-blue-500 font-bold underline decoration-blue-200 cursor-pointer px-0.5"
            >
              《征信授权协议》
            </span> 
            和 
            <span 
              onClick={(e) => { e.preventDefault(); setViewingAgreement('电子签名授权协议'); }}
              className="text-blue-500 font-bold underline decoration-blue-200 cursor-pointer px-0.5"
            >
              《电子签名授权协议》
            </span>
          </label>
        </div>
        <button 
          disabled={!agreementChecked}
          onClick={() => { handleAmountChange(loanAmount); setShowAgreementPreview(true); }}
          className="w-full py-4 btn-anyihua text-lg shadow-xl shadow-blue-100 transition-transform active:scale-95 disabled:opacity-30 disabled:grayscale"
        >
          确认借款
        </button>
      </div>

      {/* Repayment Plan Modal */}
      {showRepaymentPlan && (
        <div className="fixed inset-0 bg-black/40 z-[300] flex items-end animate-in fade-in duration-300">
          <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 animate-slide-up duration-300 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="font-bold text-lg">还款计划明细</h3>
              <button onClick={() => setShowRepaymentPlan(false)} className="text-gray-400 active:scale-90 transition-transform"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="overflow-y-auto flex-1 pb-10 scrollbar-hide">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400 font-normal border-b border-gray-50">
                  <tr>
                    <th className="py-3 font-normal">期数</th>
                    <th className="py-3 font-normal">应还本息</th>
                    <th className="py-3 font-normal text-right">剩余本金</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Array.from({ length: loanPeriod }).map((_, i) => {
                    const monthly = calculateMonthly();
                    const remaining = (loanAmount - (loanAmount / loanPeriod) * (i + 1)).toFixed(2);
                    return (
                      <tr key={i} className="text-gray-800">
                        <td className="py-4 font-medium text-xs text-gray-400">{i + 1}/{loanPeriod}期</td>
                        <td className="py-4 font-bold amount-font">￥{monthly}</td>
                        <td className="py-4 text-right amount-font text-xs text-gray-400">￥{Math.max(0, Number(remaining)).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Agreement Details */}
      {viewingAgreement && (
        <div className="fixed inset-0 bg-white z-[150] flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="p-4 flex items-center gap-4 border-b border-gray-50 shrink-0">
            <button onClick={() => setViewingAgreement(null)} className="w-8 h-8 flex items-center justify-center text-gray-600">
              <i className="fas fa-times text-lg"></i>
            </button>
            <h1 className="text-lg font-bold">协议详情预览</h1>
          </header>
          <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-600 leading-relaxed scrollbar-hide">
            <h2 className="text-center font-bold text-gray-800 text-lg mb-6">《{viewingAgreement}》</h2>
            <p className="mb-4">甲方（借款人）：{user.name}</p>
            <p className="mb-4">乙方：好分期消费金融有限公司</p>
            <div className="space-y-4">
              <p>1. 本协议由借款人自愿签署，用于授权乙方在借款审批及贷后管理过程中，依法向中国人民银行征信中心及其他合法机构查询、调取、保存及使用借款人的信用信息。</p>
              <p>2. 借款人理解并同意，乙方的电子签名技术符合相关法律法规要求，具有与手写签名同等的法律效力。</p>
              <p>3. 借款人承诺提供的信息真实有效，如因信息虚假导致的法律责任由借款人承担。</p>
              <p>4. 乙方承诺严格保护借款人的个人隐私及信用信息安全，未经授权不向任何无关第三方提供。</p>
              <p>5. 本协议项下的任何争议应首先通过友好协商解决，协商不成的，可向乙方所在地人民法院提起诉讼。</p>
              <div className="h-40"></div>
              <p className="text-right italic">（协议正文完）</p>
              <div className="h-20"></div>
            </div>
          </div>
          <div className="p-5 bg-white border-t border-gray-100 shrink-0">
            <button onClick={() => setViewingAgreement(null)} className="w-full py-4 bg-blue-600 text-white rounded-full font-bold">已阅读并返回</button>
          </div>
        </div>
      )}

      {/* Purpose Picker Modal */}
      {showPurposePicker && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end animate-in fade-in duration-300">
          <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 animate-slide-up duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">选择借款用途</h3>
              <button onClick={() => setShowPurposePicker(false)} className="text-gray-400"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="space-y-2 mb-10">
              {['个人日常消费', '装修/家具采购', '旅游/教育培训', '数码/家电消费'].map(p => (
                <button 
                  key={p} 
                  onClick={() => { setLoanPurpose(p); setShowPurposePicker(false); }}
                  className={`w-full text-left py-4 px-4 rounded-xl border font-bold text-sm transition-all ${loanPurpose === p ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-transparent text-gray-500'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agreement Preview (Final Confirm) - Multi-Agreement Support */}
      {showAgreementPreview && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-end sm:items-center justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-5 border-b border-gray-50 shrink-0">
              <h3 className="text-center font-bold text-lg">借款协议预览</h3>
            </div>
            
            {/* Agreement Tabs */}
            <div className="flex bg-gray-50/50 p-1 mx-4 mt-4 rounded-xl shrink-0">
              {['消费金融协议', '信托借款协议', '银行存管协议'].map((name, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentAgreementTab(i)}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${currentAgreementTab === i ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  {name.replace('协议', '')}
                </button>
              ))}
            </div>

            {/* Agreement Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
               {currentAgreementTab === 0 && (
                 <div className="animate-in fade-in">
                    <h4 className="font-bold text-gray-800 mb-4">《某消费金融公司个人借款协议》</h4>
                    <div className="text-[11px] text-gray-500 leading-relaxed space-y-4">
                      <p>本协议由借款人（以下简称“甲方”）与某消费金融股份有限公司（以下简称“乙方”）共同签署。</p>
                      <p>1. 乙方根据甲方提交的申请，同意向甲方提供最高额度为人民币{user.creditLimit.toLocaleString()}元的授信服务。本笔借款金额为{loanAmount.toLocaleString()}元。</p>
                      <p>2. 借款用途：甲方承诺本笔借款仅用于“{loanPurpose}”，不得用于购房、证券投资等法律法规禁止性领域。</p>
                      <p>3. 利息与费用：本笔借款年化利率为{interestRate}（单利计算），按月分期偿还。</p>
                      <p>4. 乙方有权通过合法方式对甲方履行本协议情况进行贷后管理及风险监控。</p>
                    </div>
                 </div>
               )}
               {currentAgreementTab === 1 && (
                 <div className="animate-in fade-in">
                    <h4 className="font-bold text-gray-800 mb-4">《某信托公司资金信托贷款合同》</h4>
                    <div className="text-[11px] text-gray-500 leading-relaxed space-y-4">
                      <p>借款人：{user.name} | 受托人：某国际信托有限公司</p>
                      <p>1. 资金来源：本贷款资金来源于“某个人消费贷款集合资金信托计划”，由受托人根据信托文件约定发放。</p>
                      <p>2. 担保措施：本合同项下贷款为信用贷款，无需提供抵押或质押，但借款人需授权乙方进行电子存证及存管账户扣划。</p>
                      <p>3. 提前还款：借款人可在借款满一期后申请提前清偿，相关手续费按合同附件执行。</p>
                      <p>4. 违约责任：若甲方未按期足额偿还款项，乙方有权按日加收万分之五的逾期违约金。</p>
                    </div>
                 </div>
               )}
               {currentAgreementTab === 2 && (
                 <div className="animate-in fade-in">
                    <h4 className="font-bold text-gray-800 mb-4">《某银行资金存管及结算服务协议》</h4>
                    <div className="text-[11px] text-gray-500 leading-relaxed space-y-4">
                      <p>甲方：{user.name} | 乙方：某城市商业银行</p>
                      <p>1. 账户管理：乙方作为资金存管银行，将根据甲方的指令（或授权乙方的指令）为甲方开立电子簿记账户用于借款资金的接收与划付。</p>
                      <p>2. 划款授权：甲方授权乙方在还款日从甲方绑定的银行卡（尾号{bankAccount.slice(-4)}）中自动划扣应还款项。</p>
                      <p>3. 账户安全：甲方应妥善保管电子银行密码及手机动态验证码，因甲方操作不当导致的损失由甲方承担。</p>
                      <p>4. 信息披露：乙方承诺按监管要求对甲方的账户明细进行披露，并定期同步至征信系统。</p>
                    </div>
                 </div>
               )}
               <div className="h-10"></div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 bg-gray-50 flex gap-3 shrink-0">
              <button onClick={() => setShowAgreementPreview(false)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 active:bg-gray-100 transition-colors">返回修改</button>
              <button onClick={handleFinalConfirm} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold active:bg-blue-700 transition-colors shadow-lg shadow-blue-100">立即签署</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderService = () => (
    <div className="flex flex-col h-screen bg-[#F7F9FC] animate-in slide-in-from-right duration-300">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center text-gray-600">
            <i className="fas fa-chevron-left"></i>
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-800">{isHumanService ? '人工客服小美' : '智能客服助手'}</h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-400">在线</span>
            </div>
          </div>
        </div>
        <button 
          onClick={switchToHuman}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isHumanService ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 active:scale-95'}`}
          disabled={isHumanService}
        >
          {isHumanService ? '已连人工' : '转人工'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'user' ? 'bg-blue-100 text-blue-500' : 'bg-white shadow-sm border border-gray-50'}`}>
                <i className={`fas ${msg.type === 'user' ? 'fa-user' : 'fa-robot'} text-xs`}></i>
              </div>
              <div className={`p-3 text-sm leading-relaxed shadow-sm ${msg.type === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex justify-start animate-in fade-in">
             <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-50 flex items-center justify-center shrink-0">
                  <i className="fas fa-robot text-xs"></i>
                </div>
                <div className="bg-white p-3 px-4 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-white p-4 pb-10 border-t border-gray-100 shrink-0">
        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-gray-50 rounded-2xl px-4 flex items-center border border-gray-100 focus-within:border-blue-300 transition-all">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="请输入您的问题..." 
              className="flex-1 bg-transparent border-none text-sm focus:ring-0 py-3" 
            />
          </div>
          <button 
            onClick={handleSendMessage}
            className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform disabled:bg-gray-300"
            disabled={!chatInput.trim() || isAiTyping}
          >
            <i className="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="absolute inset-0 bg-white/95 z-[200] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 mb-8 relative">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fas fa-shield-halved text-2xl text-blue-600"></i>
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2">贷款审批中</h2>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">签署成功，正在极速审批<br/><span className="animate-pulse text-blue-600">请您耐心等待，切勿关闭页面...</span></p>
    </div>
  );

  const renderSuccess = () => {
    // Calculate first repayment date (1 month from today)
    const today = new Date();
    const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
    const repaymentDateStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;

    return (
      <div className="absolute inset-0 bg-white z-[200] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 pt-12 pb-40 scrollbar-hide">
          {/* Status Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-green-100 animate-in zoom-in duration-700 delay-300">
              <i className="fas fa-check text-4xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">放款成功</h2>
            <p className="text-gray-400 text-[11px] font-medium tracking-wide">您的贷款已发放，请留意账户变动</p>
          </div>
          
          {/* Amount Display - Borrow Application Style */}
          <div className="mb-8 bg-blue-50/30 rounded-3xl p-8 border border-blue-50 flex flex-col items-center">
            <p className="text-blue-400 text-[11px] font-bold uppercase mb-2 tracking-widest">放款金额 (元)</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-blue-600 amount-font">￥</span>
              <h3 className="text-5xl font-bold text-blue-600 amount-font tracking-tighter">{loanAmount.toLocaleString()}.00</h3>
            </div>
          </div>
          
          {/* Details List - Borrow Application Style (Consistent Card & Rows) */}
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
              <span className="text-gray-500 text-sm">出资机构</span>
              <span className="text-gray-800 font-bold text-sm">联合出资(消金/信托/银行)</span>
            </div>
            <div className="px-5 py-4 flex justify-between items-center border-b border-gray-50">
              <span className="text-gray-500 text-sm">首个还款日</span>
              <span className="text-gray-800 font-bold text-sm">{repaymentDateStr}</span>
            </div>
            <div 
              className="px-5 py-4 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
              onClick={() => setShowRepaymentPlan(true)}
            >
              <span className="text-gray-500 text-sm">首次还款金额</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold text-sm">￥{calculateMonthly()}</span>
                <i className="fas fa-chevron-right text-[10px] text-blue-200"></i>
              </div>
            </div>
          </div>
          
          {/* Tip Area */}
          <div className="px-4 flex items-start gap-3 opacity-60">
             <i className="fas fa-info-circle text-blue-500 text-xs mt-0.5"></i>
             <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
               温馨提示：实际到账时间视银行结算速度而定，通常在5分钟内完成。请确保在还款日前在您的还款账户中预留足额资金。
             </p>
          </div>
        </div>
        
        {/* Fixed Footer - Borrow Application Style */}
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-100 p-5 pb-8 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => { setIsSuccess(false); setActiveTab('home'); }} 
            className="w-full py-4 btn-anyihua text-lg shadow-xl shadow-blue-100 transition-transform active:scale-95"
          >
            我知道了
          </button>
        </div>
      </div>
    );
  };

  const renderNotifications = () => {
    const getTypeConfig = (type: string) => {
      switch (type) {
        case 'CreditLimit': return { icon: 'fa-arrow-trend-up', color: 'text-orange-500', bg: 'bg-orange-50' };
        case 'Marketing': return { icon: 'fa-gift', color: 'text-purple-500', bg: 'bg-purple-50' };
        case 'Reminder': return { icon: 'fa-clock', color: 'text-rose-500', bg: 'bg-rose-50' };
        case 'Success': return { icon: 'fa-circle-check', color: 'text-emerald-500', bg: 'bg-emerald-50' };
        default: return { icon: 'fa-bell', color: 'text-blue-500', bg: 'bg-blue-50' };
      }
    };

    return (
      <div className="pb-24 pt-6 px-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('home')} className="w-8 h-8 flex items-center justify-center text-gray-600 active:scale-90 transition-transform">
              <i className="fas fa-chevron-left text-lg"></i>
            </button>
            <h1 className="text-xl font-bold text-gray-800">消息中心</h1>
          </div>
          <button onClick={handleReadAll} className="text-xs text-blue-500 font-bold active:opacity-60 bg-blue-50 px-3 py-1.5 rounded-full">忽略全部</button>
        </div>
        
        <div className="space-y-4">
          {notifications.map(n => {
            const config = getTypeConfig(n.type);
            return (
              <div 
                key={n.id} 
                onClick={() => handleMarkAsRead(n.id)} 
                className={`group bg-white rounded-2xl p-4 shadow-sm transition-all active:scale-[0.98] flex gap-4 border border-transparent ${n.isRead ? 'opacity-50' : 'border-blue-100/50 shadow-blue-900/5 ring-4 ring-blue-50/20'}`}
              >
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-xl ${config.bg} ${config.color}`}>
                  <i className={`fas ${config.icon}`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-[14px] text-gray-800">{n.title}</h3>
                    <span className="text-[10px] text-gray-400 font-medium">{n.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{n.message}</p>
                  {!n.isRead && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">未读消息</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="py-12 text-center">
            <p className="text-xs text-gray-300 font-medium">— 仅展示最近30天的消息 —</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F7F9FC] relative flex flex-col shadow-xl overflow-x-hidden border-x border-gray-100">
      {isProcessing && renderProcessing()}
      {isSuccess && renderSuccess()}
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'apply' && renderApply()}
        {activeTab === 'loans' && renderLoans()}
        {activeTab === 'loan-records' && renderLoanRecords()}
        {activeTab === 'loan-details' && renderLoanDetails()}
        {activeTab === 'increase-limit' && renderIncreaseLimit()}
        {activeTab === 'welfare-center' && renderWelfareCenter()}
        {activeTab === 'coupons' && renderCoupons()}
        {activeTab === 'short-drama' && renderShortDrama()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'service' && renderService()}
        {(activeTab === 'advisor') && (
          <div className="p-10 text-center flex flex-col items-center justify-center h-full text-gray-300">
            <i className="fas fa-tools text-5xl mb-4"></i>
            <p>功能开发中...</p>
            <button onClick={() => setActiveTab('home')} className="mt-4 text-blue-500 font-bold">返回首页</button>
          </div>
        )}
      </div>

      {(activeTab !== 'service' && activeTab !== 'apply' && activeTab !== 'loan-records' && activeTab !== 'loan-details' && activeTab !== 'increase-limit' && activeTab !== 'welfare-center' && activeTab !== 'coupons' && activeTab !== 'short-drama') && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-16 bg-white border-t border-gray-100 flex items-center justify-around z-50">
          {[
            { id: 'home', icon: 'fa-house-chimney', label: '首页' },
            { id: 'apply', icon: 'fa-chart-line', label: '借钱' },
            { id: 'loans', icon: 'fa-wallet', label: '还款' },
            { id: 'advisor', icon: 'fa-user', label: '我的' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center w-1/4 h-full gap-0.5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <i className={`fas ${tab.icon} text-lg`}></i>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default App;
