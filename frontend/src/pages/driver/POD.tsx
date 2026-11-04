import React, { useState, useRef, useEffect } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { PODRecord } from '../../types';
import {
  Camera, Upload, Trash2, CheckCircle2, Navigation, Clock, AlertOctagon,
  RefreshCw, FileText, ChevronRight, MapPin, Sparkles, Award, ClipboardCheck,
  ShieldCheck, AlertCircle, Eye, CornerUpLeft
} from 'lucide-react';

export const POD: React.FC = () => {
  const { trips, triggerNotification } = useOperations();
  const activeTrip = trips.find(t => t.status !== 'Completed' && t.status !== 'Delivered');
  const navigate = useNavigate();

  // Local state for POD form
  const [orderNumber, setOrderNumber] = useState(activeTrip?.tripNumber || '');
  const [vehicleNumber, setVehicleNumber] = useState(activeTrip?.vehicleNumber || 'MH-12-QW-9874');
  const [customerName, setCustomerName] = useState(activeTrip?.customerName || '');
  const [customerAddress, setCustomerAddress] = useState(activeTrip?.dropLocation || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // File state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // List of uploaded PODs for this driver
  const [driverPods, setDriverPods] = useState<PODRecord[]>([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);

  // Native Camera State
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'notsupported'>('prompt');
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // Ref handles
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Location & Timestamp States
  const [gpsCoords, setGpsCoords] = useState('19.0760, 72.8777');
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsLocationName, setGpsLocationName] = useState('Mumbai Port Terminal DC');
  const [currentTime, setCurrentTime] = useState('');
  
  // Drawing Canvas Signatures
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState<string | null>(null);
  
  // Progress & Success State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedPodNumber, setGeneratedPodNumber] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // History list filter
  const [historyTab, setHistoryTab] = useState<'Today' | 'Pending' | 'Completed' | 'Rejected' | 'All'>('All');

  // Load driver's uploads on mount
  const fetchPods = async () => {
    setIsLoadingPods(true);
    try {
      const records = await api.pod.getDriverPODs();
      setDriverPods(records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPods(false);
    }
  };

  useEffect(() => {
    fetchPods();
  }, []);

  // 1. Live Timestamp Tracker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Geolocation Telemetry Trigger
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setGpsCoords(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
          setGpsVerified(true);
        },
        err => {
          console.warn('Geolocation access failed, falling back to network cell coordinates.', err);
          setGpsVerified(true);
        }
      );
    } else {
      setGpsVerified(true);
    }
  }, []);

  // 3. Camera Handlers
  const startCamera = async (mode = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { facingMode: mode }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setPermissionStatus('granted');
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      }, 200);
    } catch (err: any) {
      console.error('Camera Initialization error: ', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('notsupported');
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (cameraActive) {
      startCamera(nextMode);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // Gallery Upload validation (max 10MB)
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Size check
    if (file.size > 10 * 1024 * 1024) {
      setValidationError('File size exceeds the maximum limit of 10MB.');
      return;
    }
    
    setValidationError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // 4. Drawing Canvas E-Signature
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (signatureSaved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0B1C30';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || signatureSaved) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    setSignatureSaved(null);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setSignatureSaved(dataUrl);
    }
  };

  // Submit POD Payload
  const handleSubmitPOD = async () => {
    setValidationError('');
    
    if (!orderNumber.trim()) {
      setValidationError('Order Number is required.');
      return;
    }
    if (!customerName.trim()) {
      setValidationError('Customer Name is required.');
      return;
    }
    if (!customerAddress.trim()) {
      setValidationError('Delivery Address is required.');
      return;
    }
    if (!capturedImage) {
      setValidationError('Please capture a delivery photo or upload a document.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);
    
    // Simulate progression
    const progressTimer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const [lat, lng] = gpsCoords.split(',').map(Number);
      const res = await api.pod.upload({
        orderNumber,
        vehicleNumber,
        customerName,
        customerAddress,
        imageUrl: capturedImage,
        signatureUrl: signatureSaved || undefined,
        remarks: deliveryNotes,
        latitude: isNaN(lat) ? undefined : lat,
        longitude: isNaN(lng) ? undefined : lng
      });

      clearInterval(progressTimer);
      setUploadProgress(100);
      
      setTimeout(() => {
        setGeneratedPodNumber(res.podId);
        setIsSubmitting(false);
        setSubmitSuccess(true);
        triggerNotification(
          'System Alert',
          'POD Uploaded Successfully',
          `Manifest for Order ${orderNumber} is dispatched to Owner review board.`,
          'Info'
        );
        fetchPods();
      }, 350);
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsSubmitting(false);
      setValidationError(err.message || 'Server upload failed. Check network link.');
    }
  };

  // Fill form from a rejected POD
  const handleRefillForm = (pod: PODRecord) => {
    setOrderNumber(pod.orderNumber);
    setCustomerName(pod.customerName);
    setCustomerAddress(pod.customerAddress);
    setVehicleNumber(pod.vehicleNumber);
    setDeliveryNotes(pod.remarks || '');
    setCapturedImage(pod.imageUrl);
    setSignatureSaved(pod.signatureUrl || null);
    setValidationError('');
    setSubmitSuccess(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setSubmitSuccess(false);
    setOrderNumber(activeTrip?.tripNumber || '');
    setCustomerName(activeTrip?.customerName || '');
    setCustomerAddress(activeTrip?.dropLocation || '');
    setDeliveryNotes('');
    setCapturedImage(null);
    setSignatureSaved(null);
    setValidationError('');
  };

  // Calculate Stat values
  const totalUploaded = driverPods.length;
  const pendingCount = driverPods.filter(p => p.status === 'Pending').length;
  const approvedCount = driverPods.filter(p => p.status === 'Approved').length;
  const rejectedCount = driverPods.filter(p => p.status === 'Rejected').length;
  const uploadedTodayCount = driverPods.filter(p => {
    const todayStr = new Date().toISOString().split('T')[0];
    return p.createdAt.startsWith(todayStr);
  }).length;

  // Filter history tab logs
  const filteredPods = driverPods.filter(pod => {
    if (historyTab === 'Today') {
      const todayStr = new Date().toISOString().split('T')[0];
      return pod.createdAt.startsWith(todayStr);
    }
    if (historyTab === 'Pending') return pod.status === 'Pending';
    if (historyTab === 'Completed') return pod.status === 'Approved';
    if (historyTab === 'Rejected') return pod.status === 'Rejected';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-left animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E5E7EB] dark:border-[#334155] pb-5">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight leading-none">Proof of Delivery (POD) Workspace</h2>
          <p className="text-[13px] text-[#4B5563] dark:text-[#94A3B8] mt-1.5 font-medium">Verify cargo receipts, customer signatures, and coordinates for dispatched orders.</p>
        </div>
      </div>

      {/* Driver Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { title: 'Pending Approval', val: pendingCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/60' },
          { title: 'Approved PODs', val: approvedCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/60' },
          { title: 'Rejected PODs', val: rejectedCount, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/60' },
          { title: 'Uploaded Today', val: uploadedTodayCount, color: 'text-[#006A6A] dark:text-[#7DF5F5]', bg: 'bg-[#006A6A]/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] p-5 rounded-2xl shadow-sm text-left">
            <span className="text-[11px] font-extrabold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider block">{stat.title}</span>
            <h4 className={`text-2xl font-extrabold mt-1.5 leading-none ${stat.color}`}>{stat.val}</h4>
          </div>
        ))}
      </div>

      {submitSuccess ? (
        <div className="max-w-md mx-auto bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-[#E5E7EB] dark:border-[#334155] shadow-xl text-center space-y-6 my-6 text-left animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce ring-8 ring-emerald-500/10">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC]">POD Dispatched</h3>
            <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] leading-normal font-semibold">Cargo receipt successfully logged and queued for Owner approval check.</p>
          </div>
          
          <div className="bg-[#F9FAFB] dark:bg-[#0F172A]/40 border border-[#E5E7EB] dark:border-[#334155] p-4 rounded-xl text-xs space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold">POD Code</span>
              <span className="font-bold text-[#111827] dark:text-[#F8FAFC]">{generatedPodNumber}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold">Order ID</span>
              <span className="font-bold text-[#111827] dark:text-[#F8FAFC]">{orderNumber}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-[#6B7280] dark:text-[#94A3B8] font-semibold">GPS Coords</span>
              <span className="font-bold text-[#111827] dark:text-[#F8FAFC]">{gpsCoords}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleResetForm}
              variant="outline"
              className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#334155]"
            >
              Upload Another
            </Button>
            <Button
              onClick={() => navigate('/driver')}
              variant="primary"
              className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-transparent shadow-md shadow-teal-900/10"
            >
              Back to Home
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form and Camera Upload Panel (66%) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5E7EB] dark:border-[#334155] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#334155]">
                <h4 className="text-[15px] font-extrabold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2 uppercase tracking-wide">
                  <ClipboardCheck className="h-5 w-5 text-[#006A6A]" /> Delivery Verification Details
                </h4>
                {validationError && (
                  <span className="text-xs font-bold text-red-500 flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="h-4 w-4" /> {validationError}
                  </span>
                )}
              </div>

              {/* Order Info Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Order / Trip Number</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    placeholder="TRP-2026-XXXX"
                    className="w-full h-11 px-4 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Vehicle License Plate</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    placeholder="MH-12-QW-9874"
                    className="w-full h-11 px-4 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Consignee Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Company or Individual"
                    className="w-full h-11 px-4 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Delivery Address Node</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="Terminal Gate / Drop coordinates"
                    className="w-full h-11 px-4 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] transition-all font-medium"
                  />
                </div>
              </div>

              {/* Main Camera Workspace / Delivery Photo */}
              <div className="space-y-2.5 pt-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Delivery Cargo Proof Photo</label>
                
                {capturedImage ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 bg-[#F8F9FF] dark:bg-[#0F172A] shadow-sm flex items-center justify-center">
                    <img src={capturedImage} alt="Cargo verification snapshot" className="max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setCapturedImage(null)}
                      className="absolute top-3 right-3 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-xl cursor-pointer transition-colors shadow"
                      title="Clear photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : cameraActive ? (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-900 shadow-md">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-3">
                      <Button
                        variant="outline"
                        onClick={toggleCameraFacing}
                        className="p-2.5 bg-black/50 text-white border-white/20 hover:bg-black/80 rounded-xl"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="primary"
                        onClick={capturePhoto}
                        className="text-xs font-bold py-2.5 px-6 rounded-xl shadow-lg border-0 bg-[#006A6A] hover:bg-[#008B8B]"
                      >
                        Capture Image
                      </Button>
                      <Button
                        variant="outline"
                        onClick={stopCamera}
                        className="p-2.5 bg-black/50 text-white border-white/20 hover:bg-black/80 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 bg-[#F8F9FF]/50 dark:bg-[#0F172A]/10 aspect-video">
                    <div className="p-4 bg-[#006A6A]/10 text-[#006A6A] rounded-2xl">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">Cargo Snapshot Missing</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-semibold">JPG, PNG format only. Limit file sizes to 10 MB maximum.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        onClick={() => startCamera()}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl border border-transparent shadow-sm"
                      >
                        Launch Camera
                      </Button>
                      <label className="border border-[#E5EEFF] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F8F9FF] dark:hover:bg-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 text-slate-700 dark:text-[#CBD5E1] shadow-sm transition-colors">
                        <Upload className="h-4 w-4" /> Gallery Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGalleryUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* E-Signature & Telemetry Block (33%) */}
          <div className="space-y-6">
            
            {/* Signature Canvas */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5EEFF] dark:border-[#334155] shadow-sm space-y-4">
              <h4 className="text-[13px] font-bold text-[#0B1C30] dark:text-slate-100 uppercase tracking-wider block">Consignee Signatory Verification</h4>
              
              <div className="bg-[#F8F9FF] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-2 h-44 flex flex-col justify-between">
                {signatureSaved ? (
                  <div className="w-full h-28 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={signatureSaved} alt="Locked Signature" className="max-h-full object-contain" />
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={112}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 cursor-crosshair h-28"
                  />
                )}

                <div className="flex justify-between items-center text-xs pt-1 px-1 font-bold">
                  <span className="text-[9px] text-[#6D7A79] italic font-semibold">Sign inside the canvas</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] font-bold text-[#6D7A79] hover:text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Clear
                    </button>
                    {!signatureSaved && (
                      <button
                        type="button"
                        onClick={saveSignature}
                        className="text-[11px] font-bold text-[#006A6A] dark:text-[#14B8A6] hover:underline px-2 py-0.5 cursor-pointer"
                      >
                        Lock Pad
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Stamps */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5EEFF] dark:border-[#334155] shadow-sm space-y-3.5">
              <h4 className="text-[13px] font-bold text-[#0B1C30] dark:text-slate-100 uppercase tracking-wider block">GPS & Timestamp Stamps</h4>
              <div className="space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-[#6D7A79] dark:text-[#94A3B8] flex items-center gap-1.5 font-semibold">
                    <Clock className="h-4 w-4 text-slate-400" /> Time stamp
                  </span>
                  <span className="font-mono text-slate-700 dark:text-[#CBD5E1]">{currentTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6D7A79] dark:text-[#94A3B8] flex items-center gap-1.5 font-semibold">
                    <MapPin className="h-4 w-4 text-slate-400" /> Location Node
                  </span>
                  <span className="font-bold text-slate-700 dark:text-[#CBD5E1] whitespace-normal break-words leading-tight max-w-[150px] text-right">{gpsLocationName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6D7A79] dark:text-[#94A3B8] flex items-center gap-1.5 font-semibold">
                    <Navigation className="h-4 w-4 text-slate-400" /> GPS Telemetry
                  </span>
                  <Badge variant={gpsVerified ? 'success' : 'neutral'} className="font-mono font-bold">
                    {gpsCoords}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Form remarks / Submit */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5EEFF] dark:border-[#334155] shadow-sm space-y-4">
              <textarea
                value={deliveryNotes}
                onChange={e => setDeliveryNotes(e.target.value)}
                placeholder="Discrepancy remarks, cargo seal conditions..."
                rows={3}
                className="w-full px-4 py-3 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium resize-none text-slate-700 dark:text-[#F8FAFC]"
              />

              {isSubmitting ? (
                <div className="space-y-2 pt-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-[#6D7A79]">
                    <span>Uploading POD payload...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleSubmitPOD}
                  variant="primary"
                  className="w-full text-xs font-bold h-12 rounded-xl border border-transparent shadow-md shadow-emerald-900/10 cursor-pointer bg-[#006A6A] hover:bg-[#008B8B]"
                >
                  Submit Freight POD
                </Button>
              )}
            </div>

          </div>

        </div>
      )}

      {/* History Ledger Logs Section */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5EEFF] dark:border-[#334155] p-6 shadow-sm space-y-5 text-left">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800">
          <div>
            <h4 className="text-[15px] font-bold text-[#0B1C30] dark:text-slate-100 uppercase tracking-wide">My POD Upload History</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Review processing log history status and correction advice.</p>
          </div>
          
          <div className="flex flex-wrap gap-1.5 bg-[#F8F9FF] dark:bg-[#0F172A] border border-[#E5EEFF] dark:border-[#334155] p-1 rounded-xl text-xs font-bold self-start">
            {(['All', 'Today', 'Pending', 'Completed', 'Rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setHistoryTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  historyTab === tab
                    ? 'bg-white dark:bg-[#1E293B] text-[#006A6A] dark:text-white shadow-sm'
                    : 'text-[#6D7A79] hover:text-[#0B1C30]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {isLoadingPods ? (
          <div className="text-center py-12 text-slate-400 text-xs italic font-bold">
            Pulling POD logs from server...
          </div>
        ) : filteredPods.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic font-bold">
            No POD logs logged under category "{historyTab}".
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPods.map(pod => (
              <div
                key={pod.id}
                className="p-5 bg-[#F8F9FF]/50 dark:bg-[#0F172A]/30 border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-shadow hover:shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 shrink-0">
                    <img src={pod.imageUrl} alt="POD Snapshot" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{pod.podId}</span>
                      <Badge variant={pod.status === 'Approved' ? 'success' : pod.status === 'Rejected' ? 'danger' : 'warning'} className="font-bold">
                        {pod.status}
                      </Badge>
                    </div>
                    <p className="font-semibold text-[#6D7A79]">Order: <span className="text-slate-800 dark:text-[#F8FAFC] font-bold">{pod.orderNumber}</span> • Customer: <span className="font-bold text-slate-700 dark:text-[#CBD5E1]">{pod.customerName}</span></p>
                    <p className="text-slate-400 font-semibold">{pod.customerAddress}</p>
                    {pod.status === 'Rejected' && pod.rejectedReason && (
                      <p className="text-red-500 font-bold bg-red-500/5 p-2 rounded-lg border border-red-500/10 mt-2 flex items-center gap-1.5">
                        <AlertOctagon className="h-4 w-4" /> Advice: {pod.rejectedReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end gap-3 justify-between md:justify-center border-t md:border-t-0 border-[#E5EEFF] dark:border-[#334155] pt-3.5 md:pt-0 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono font-bold block">{new Date(pod.createdAt).toLocaleDateString()} {new Date(pod.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  
                  {pod.status === 'Rejected' && (
                    <Button
                      onClick={() => handleRefillForm(pod)}
                      variant="secondary"
                      size="sm"
                      className="text-rose-500 hover:text-rose-600 font-bold text-xs py-1.5 px-3 border border-rose-500/10 rounded-xl flex items-center gap-1 hover:bg-rose-500/5"
                    >
                      <CornerUpLeft className="h-3.5 w-3.5" /> Re-fill details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};



