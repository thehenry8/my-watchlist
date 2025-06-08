import React, { useState, useEffect, useCallback } from 'react';

// Firebase Imports (will be loaded from CDN in the Canvas environment)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// StockCard Component: Displays individual stock information in the watchlist
const StockCard = ({ stock, onSelectStock, onRemoveStock }) => {
  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'; // Darker for light background

  // Truncate description for watchlist view
  const briefDescription = stock.description.split('.')[0] + (stock.description.includes('.') ? '.' : '');

  return (
    <div
      className="relative bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col border border-gray-200"
      onClick={() => onSelectStock(stock)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onRemoveStock(stock.symbol); }}
        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-200"
        title="Remove from watchlist"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-gray-900">{stock.symbol}</h3>
          <p className="text-gray-600 text-sm">{stock.companyName}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-900 text-2xl font-bold">${stock.price.toFixed(2)}</p>
          <p className={`text-md font-semibold ${changeColor}`}>
            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Brief company explanation */}
      <p className="text-gray-700 text-xs mt-1 mb-2 leading-tight">
        {briefDescription}
      </p>

      <div className="grid grid-cols-2 gap-2 text-gray-700 text-sm mt-2 pt-2 border-t border-gray-100">
        <div>
          <p>Market Cap:</p>
          <p className="font-medium">{stock.marketCap}</p>
        </div>
        <div>
          <p>Volume:</p>
          <p className="font-medium">{stock.volume}</p>
        </div>
        <div>
          <p>P/E Ratio:</p>
          <p className="font-medium">{stock.peRatio}</p>
        </div>
        <div>
          <p>52-Week High:</p>
          <p className="font-medium">${stock.week52High.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

// StockDetails Component: Displays detailed information about a selected stock
const StockDetails = ({ stock, isLoading, error, llmInsight, companyBrief, generateCompanyBrief, newsSummary, generateNewsSummary }) => {
  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center text-white min-h-[500px] flex items-center justify-center">
        <p className="animate-pulse">Loading stock details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-800 text-white p-6 rounded-lg shadow-xl text-center min-h-[500px] flex items-center justify-center">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center text-gray-400 min-h-[500px] flex items-center justify-center">
        <p>Select a stock from your watchlist to see details.</p>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        {stock.companyName} ({stock.symbol})
        <span className={`ml-4 text-xl ${changeColor}`}>
          ${stock.price.toFixed(2)} {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
        </span>
      </h2>

      {/* Interactive Chart - First and prominent */}
      <div className="mt-4 mb-6 bg-gray-700 p-4 rounded-md min-h-[300px] flex items-center justify-center border border-blue-500">
        <p className="text-blue-300 text-center font-bold text-lg">
          Interactive Stock Chart (Similar to TradingView)
          <br />
          <span className="text-sm font-normal text-gray-400">
            (Requires integration with a charting library/widget and a live data API)
          </span>
        </p>
      </div>

      {/* Detailed Company Description */}
      <div className="bg-gray-700 p-4 rounded-md mt-6">
        <h3 className="text-lg font-semibold text-white mb-2">Detailed Company Description</h3>
        <p className="text-sm text-gray-300">{stock.description}</p>
        <button
          onClick={() => generateCompanyBrief(stock.companyName, stock.description)}
          className="mt-4 px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition duration-200"
        >
          Generate Concise Summary ✨
        </button>
        {companyBrief && (
          <p className="text-sm text-gray-300 mt-2 p-2 bg-gray-600 rounded-md">{companyBrief}</p>
        )}
      </div>

      {/* AI-powered Analysis */}
      <div className="mt-6 bg-gray-700 p-4 rounded-md">
        <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Financial Analysis ✨</h3>
        {llmInsight ? (
          <p className="text-sm text-gray-300">{llmInsight}</p>
        ) : (
          <p className="text-sm text-gray-400">Generating AI analysis...</p>
        )}
      </div>

      {/* Latest News Section - Now directly below company details */}
      <div className="mt-6 bg-gray-700 p-4 rounded-md">
        <h2 className="text-2xl font-bold text-white mb-4">Latest News for {stock.symbol}</h2>
        <button
          onClick={() => generateNewsSummary(stock.news)}
          className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition duration-200 shadow-md"
        >
          Generate News Summary ✨
        </button>

        {newsSummary && (
          <div className="bg-gray-600 p-4 rounded-md mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered News Summary</h3>
            <p className="text-sm text-gray-300">{newsSummary}</p>
          </div>
        )}

        <div className="space-y-4">
          {stock.news.map((item, index) => (
            <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-gray-500 rounded-md hover:bg-gray-600 transition duration-200">
              <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-gray-300 text-sm">{item.source} - {item.date}</p>
              <p className="text-gray-200 text-sm mt-2">{item.summary}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main application component
function App() {
  const [watchlist, setWatchlist] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [llmInsight, setLlmInsight] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [companyBrief, setCompanyBrief] = useState('');

  // Firebase
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Firebase Configuration - IMPORTANT! Canvas injects these variables.
  // We'll provide real values for local development if they are undefined.
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-personal-stock-watchlist';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyDdcI7SI6nNZ_VCYaiWnv02wnLUI9A6HZM", // <--- Asegúrate que sea EXACTO al de Firebase
    authDomain: "my-personal-stock-watchlist.firebaseapp.com",
    projectId: "my-personal-stock-watchlist",
    storageBucket: "my-personal-stock-watchlist.firebasestorage.app", // <--- ¡Este es tu valor correcto!
    messagingSenderId: "664821642677",
    appId: "1:664821642677:web:08872a64bcecd2201515fc", // <--- ¡Este es tu valor correcto!
    measurementId: "G-BCTHRD4S91"
  };
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  const allStocks = [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      price: 175.00,
      change: -1.25,
      changePercent: -0.71,
      marketCap: '2.7T',
      volume: '80M',
      peRatio: 28.5,
      week52High: 198.23,
      week52Low: 140.00,
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. Its core products include the iPhone, iPad, Mac, Apple Watch, and Apple TV. The company also sells a variety of related services, such as Apple Music, iCloud, Apple Pay, and the App Store. Apple is renowned for its innovation in consumer electronics and strong brand loyalty, consistently pushing boundaries in design and technology.',
      news: [
        { title: 'Apple shares dip as iPhone sales predictions lowered', source: 'Reuters', date: 'June 6, 2025', url: '#', summary: 'Analysts are revising down iPhone sales targets due to global economic headwinds and increasing competition in key markets.' },
        { title: 'Apple unveils new AI features at WWDC', source: 'TechCrunch', date: 'June 5, 2025', url: '#', summary: 'The tech giant showcased a range of new artificial intelligence capabilities across its software, including enhanced Siri functions and on-device AI processing for greater privacy.' },
        { title: 'New services push for Apple in Q2 earnings call', source: 'Financial Times', date: 'June 4, 2025', url: '#', summary: 'Apple reported strong growth in its services division, exceeding expectations and offsetting slight dips in hardware sales. The company highlighted subscriber growth across its various platforms.' },
      ],
    },
    {
      symbol: 'MSFT',
      companyName: 'Microsoft Corp.',
      price: 420.50,
      change: 3.10,
      changePercent: 0.74,
      marketCap: '3.1T',
      volume: '65M',
      peRatio: 35.2,
      week52High: 435.10,
      week52Low: 320.00,
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates in three segments: Productivity and Business Processes (which includes Office, LinkedIn, and Dynamics), Intelligent Cloud (Azure and server products), and More Personal Computing (Windows, Xbox, Surface). Microsoft is a leader in cloud computing, enterprise software, and gaming.',
      news: [
        { title: 'Microsoft acquires AI startup for cloud expansion', source: 'Bloomberg', date: 'June 4, 2025', url: '#', summary: 'Strategic acquisition aims to bolster Microsoft\'s position in the competitive cloud AI market, integrating advanced AI capabilities into its Azure platform.' },
        { title: 'New Windows update focuses on enterprise security', source: 'ZDNet', date: 'June 3, 2025', url: '#', summary: 'Microsoft releases critical security patches and features for business users, enhancing data protection and threat detection.' },
        { title: 'Satya Nadella discusses AI\'s role in future growth', source: 'CNBC', date: 'June 2, 2025', url: '#', summary: 'CEO highlights AI as a key driver for Microsoft\'s long-term strategy and innovation across all its product lines, emphasizing ethical AI development.' },
      ],
    },
    {
      symbol: 'GOOGL',
      companyName: 'Alphabet Inc. (Class A)',
      price: 180.20,
      change: 0.75,
      changePercent: 0.42,
      marketCap: '2.2T',
      volume: '40M',
      peRatio: 26.1,
      week52High: 185.00,
      week52Low: 120.00,
      description: 'Alphabet Inc. provides various products and services in the United States and internationally. It operates through Google Services (which includes Ads, Android, Chrome, Google Maps, Google Play, Search, and YouTube), Google Cloud, and Other Bets (such as Waymo and Verily) segments. Alphabet is best known for its search engine and vast ecosystem of digital products.',
      news: [
        { title: 'Google faces antitrust probe over search practices', source: 'Wall Street Journal', date: 'June 7, 2025', url: '#', summary: 'Regulators are intensifying scrutiny of Google\'s dominance in the search engine market, examining potential anti-competitive behavior.' },
        { title: 'Alphabet invests heavily in quantum computing research', source: 'The Verge', date: 'June 6, 2025', url: '#', summary: 'The company is dedicating significant resources to advancing quantum technology, aiming for breakthroughs in computational power and AI.' },
      ],
    },
    {
      symbol: 'AMZN',
      companyName: 'Amazon.com, Inc.',
      price: 190.10,
      change: -2.30,
      changePercent: -1.20,
      marketCap: '1.9T',
      volume: '70M',
      peRatio: 55.8,
      week52High: 195.00,
      week52Low: 130.00,
      description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally. It operates through three segments: North America, International, and Amazon Web Services (AWS). It is the world\'s largest online retailer and a leading cloud computing service provider.',
      news: [
        { title: 'Amazon expands grocery delivery service to new cities', source: 'Retail Dive', date: 'June 6, 2025', url: '#', summary: 'The e-commerce giant continues to expand its footprint in the online grocery market, enhancing its logistics and delivery networks.' },
        { title: 'AWS announces new AI-powered developer tools', source: 'TechCrunch', date: 'June 5, 2025', url: '#', summary: 'Amazon\'s cloud arm unveils innovations to streamline AI development for businesses, including new machine learning services and developer kits.' },
      ],
    },
  ];

  // --- AI Generation Functions ---
  const generateLlmInsight = useCallback(async (symbol, companyName, description) => {
    setLlmInsight('Generating AI-powered analysis...');
    try {
        const prompt = `Provide a concise and neutral financial analysis (around 50-70 words) for ${companyName} (${symbol}), considering its business: "${description}". Focus on potential trends or market sentiment.`;
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // Canvas will automatically provide it at runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setLlmInsight(text);
        } else {
            setLlmInsight('Could not generate AI analysis.');
            console.error('Unexpected LLM response structure:', result);
        }
    } catch (error) {
        setLlmInsight('Failed to generate AI analysis.');
        console.error('Error calling Gemini API for analysis:', error);
    }
  }, []);

  const generateNewsSummary = useCallback(async (newsItems) => {
    setNewsSummary('Generating news summary...');
    try {
      const newsTexts = newsItems.map(item => `${item.title}: ${item.summary}`).join('\n\n');
      const prompt = `Summarize the following news articles into a concise paragraph (around 80-100 words), highlighting key themes and overall sentiment:\n\n${newsTexts}`;
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      const apiKey = ""; // Canvas will automatically provide it at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setNewsSummary(text);
        } else {
            setNewsSummary('Could not generate news summary.');
            console.error('Unexpected LLM response structure for news summary:', result);
        }
    } catch (error) {
        setNewsSummary('Failed to generate news summary.');
        console.error('Error calling Gemini API for news summary:', error);
    }
  }, []);

  const generateCompanyBrief = useCallback(async (companyName, companyDescription) => {
    setCompanyBrief('Generating company brief...');
    try {
      const prompt = `Provide a very concise description (around 50 words) of ${companyName} based on this description: "${companyDescription}". Focus on its main business areas and recent highlights.`;
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      const apiKey = ""; // Canvas will automatically provide it at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setCompanyBrief(text);
        } else {
            setCompanyBrief('Could not generate company brief.');
            console.error('Unexpected LLM response structure for company brief:', result);
        }
    } catch (error) {
        setCompanyBrief('Failed to generate company brief.');
        console.error('Error calling Gemini API for company brief:', error);
    }
  }, []);

  // --- Stock Data Fetching Functions ---
  const fetchStockDetails = useCallback(async (symbol) => {
    setLoadingDetails(true);
    setDetailsError(null);
    setLlmInsight('');
    setNewsSummary('');
    setCompanyBrief('');

    try {
      // URL of your backend proxy.
      // IMPORTANT! When you deploy this, replace this with the actual URL of your Netlify/Google Cloud Function.
      // For local development, if you run the proxy on port 3001, it would be: 'http://localhost:3001'
      const BACKEND_PROXY_URL = 'https://YOUR_NETLIFY_FUNCTION_URL/.netlify/functions/stock-proxy'; 

      const response = await fetch(`${BACKEND_PROXY_URL}?symbol=${symbol}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Proxy error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      const mockStockData = allStocks.find(s => s.symbol === symbol) || {};
      const transformedStockData = {
        symbol: data['01. symbol'] || mockStockData.symbol,
        companyName: data['02. open'] ? `${mockStockData.companyName} (Live Data)` : mockStockData.companyName,
        price: parseFloat(data['05. price']) || mockStockData.price,
        change: parseFloat(data['09. change']) || mockStockData.change,
        changePercent: parseFloat(data['10. change percent']) ? parseFloat(data['10. change percent'].replace('%', '')) : mockStockData.changePercent,
        marketCap: mockStockData.marketCap,
        volume: data['06. volume'] || mockStockData.volume,
        peRatio: mockStockData.peRatio,
        week52High: mockStockData.week52High,
        week52Low: mockStockData.week52Low,
        description: mockStockData.description,
        news: mockStockData.news,
      };

      setSelectedStock(transformedStockData);
      generateLlmInsight(transformedStockData.symbol, transformedStockData.companyName, transformedStockData.description);

    } catch (e) {
      setDetailsError(`Error fetching data: ${e.message}. Using mock data.`);
      const fallbackStock = allStocks.find(s => s.symbol === symbol);
      if (fallbackStock) {
        setSelectedStock(fallbackStock);
        generateLlmInsight(fallbackStock.symbol, fallbackStock.companyName, fallbackStock.description);
      } else {
        setSelectedStock(null);
      }
    } finally {
      setLoadingDetails(false);
    }
  }, [allStocks, generateLlmInsight, setDetailsError, setLoadingDetails, setLlmInsight, setNewsSummary, setCompanyBrief, setSelectedStock]);

  // --- Firestore Functions for saving/loading watchlist ---
  const saveWatchlist = useCallback(async (currentWatchlist) => {
    if (!db || !userId || !isAuthReady) {
      console.log("Firebase not ready to save.");
      return;
    }
    try {
      const userWatchlistRef = doc(db, `artifacts/${appId}/users/${userId}/watchlist`, 'myWatchlist');
      await setDoc(userWatchlistRef, { stocks: JSON.stringify(currentWatchlist) });
      console.log("Watchlist saved to Firestore.");
    } catch (e) {
      console.error("Error saving watchlist:", e);
    }
  }, [db, userId, appId, isAuthReady]);

  const loadWatchlist = useCallback((dbInstance, currentUserId) => {
    if (!dbInstance || !currentUserId) return;

    const userWatchlistRef = doc(dbInstance, `artifacts/${appId}/users/${currentUserId}/watchlist`, 'myWatchlist');
    onSnapshot(userWatchlistRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.stocks) {
          try {
            const loadedStocks = JSON.parse(data.stocks);
            setWatchlist(loadedStocks);
            if (loadedStocks.length > 0 && !selectedStock) {
              fetchStockDetails(loadedStocks[0].symbol);
            }
            console.log("Watchlist loaded from Firestore.");
          } catch (e) {
            console.error("Error parsing watchlist:", e);
          }
        }
      } else {
        console.log("No watchlist found for this user.");
        if (allStocks.length > 0) {
          const defaultWatchlist = allStocks.slice(0, 2);
          setWatchlist(defaultWatchlist);
          saveWatchlist(defaultWatchlist);
        }
      }
    }, (error) => {
      console.error("Error listening to watchlist:", error);
    });
  }, [appId, selectedStock, fetchStockDetails, saveWatchlist, allStocks]);


  // --- Effect Hooks (useEffect) ---
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          loadWatchlist(dbInstance, user.uid);
        } else {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Error initializing Firebase or authenticating:", e);
    }
  }, [firebaseConfig, initialAuthToken, loadWatchlist]);

  useEffect(() => {
    if (db && userId && isAuthReady) {
      saveWatchlist(watchlist);
    }
  }, [watchlist, db, userId, isAuthReady, saveWatchlist]);

  useEffect(() => {
    if (watchlist.length > 0 && !selectedStock && isAuthReady) {
      fetchStockDetails(watchlist[0].symbol);
    }
  }, [watchlist, selectedStock, isAuthReady, fetchStockDetails]);

  const handleAddStock = () => {
    const symbolToAdd = searchTerm.trim().toUpperCase();
    if (symbolToAdd && !watchlist.some(s => s.symbol === symbolToAdd)) {
      const stockToAdd = allStocks.find(s => s.symbol === symbolToAdd);
      if (stockToAdd) {
        setWatchlist(prev => [...prev, stockToAdd]);
        setSearchTerm('');
      } else {
        alert(`Stock symbol "${symbolToAdd}" not found in our mock data.`);
      }
    }
  };

  const handleRemoveStock = (symbolToRemove) => {
    const updatedWatchlist = watchlist.filter(stock => stock.symbol !== symbolToRemove);
    setWatchlist(updatedWatchlist);
    if (selectedStock && selectedStock.symbol === symbolToRemove) {
      setSelectedStock(null);
      setLlmInsight('');
      setNewsSummary('');
      setCompanyBrief('');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-inter flex items-center justify-center">
        <p className="text-xl animate-pulse">Loading application... Initializing Firebase...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-inter p-4 sm:p-6 md:p-8">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>

      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-400">
          StockTracker Pro
        </h1>
        <p className="text-gray-300 mt-2 text-lg">Your Modern Stock Watchlist</p>
        {userId && (
          <p className="text-gray-400 text-sm mt-1">User ID: <span className="font-mono text-xs break-all">{userId}</span></p>
        )}
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-gray-100 p-6 rounded-xl shadow-2xl text-gray-900">
          <h2 className="text-2xl font-bold mb-4">My Watchlist</h2>
          <div className="flex mb-4 space-x-2">
            <input
              type="text"
              placeholder="Add stock symbol (e.g., AAPL)"
              className="flex-grow p-3 rounded-md bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddStock();
                }
              }}
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition duration-200 shadow-md"
              onClick={handleAddStock}
            >
              Add
            </button>
          </div>

          <div className="space-y-4">
            {watchlist.length === 0 ? (
              <p className="text-gray-500 text-center">Your watchlist is empty. Add some stocks!</p>
            ) : (
              watchlist.map((stock) => (
                <StockCard key={stock.symbol} stock={stock} onSelectStock={fetchStockDetails} onRemoveStock={handleRemoveStock} />
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-2 space-y-6">
          <StockDetails
            stock={selectedStock}
            isLoading={loadingDetails}
            error={detailsError}
            llmInsight={llmInsight}
            companyBrief={companyBrief}
            generateCompanyBrief={generateCompanyBrief}
            newsSummary={newsSummary}
            generateNewsSummary={generateNewsSummary}
          />
        </section>
      </div>

      <footer className="text-center text-gray-500 text-sm mt-12">
        <p>&copy; {new Date().getFullYear()} StockTracker Pro. All rights reserved.</p>
        <p>Mock and free API data. Live trading requires paid data API.</p>
      </footer>
    </div>
  );
}

export default App;
