import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface AdvertisementProps {
  type: string;
  position?: string;
  className?: string;
}

const Advertisement: React.FC<AdvertisementProps> = ({ 
  type, 
  position = 'sidebar',
  className = '' 
}) => {
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        // Fetch ad by type
        const response = await apiRequest(`/api/ads/type/${type}`);
        
        if (response.success && response.data && response.data.length > 0) {
          // Get a random ad from the available ones of this type
          const randomIndex = Math.floor(Math.random() * response.data.length);
          const randomAd = response.data[randomIndex];
          setAd(randomAd);
          
          // Record impression
          try {
            await apiRequest(`/api/ads/impression/${randomAd.id}`, {
              method: 'POST'
            });
          } catch (impressionError) {
            console.error('Failed to record ad impression:', impressionError);
          }
        } else {
          setAd(null);
        }
      } catch (fetchError) {
        console.error('Error fetching advertisement:', fetchError);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [type]);

  const handleAdClick = async () => {
    if (!ad) return;
    
    try {
      // Record click
      const response = await apiRequest(`/api/ads/click/${ad.id}`, {
        method: 'POST'
      });
      
      // Open target URL in a new tab
      if (response.success && response.redirectUrl) {
        window.open(response.redirectUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (clickError) {
      console.error('Failed to record ad click:', clickError);
      // Open target URL anyway
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render anything if no ad is available or there's an error
  if (!ad || error) return null;
  
  // Don't render during loading
  if (loading) return null;

  // Determine styling based on position
  let positionStyles = '';
  
  switch (position) {
    case 'banner':
      positionStyles = 'w-full h-[120px] md:h-[90px]';
      break;
    case 'sidebar':
      positionStyles = 'w-full max-w-[300px] h-[250px]';
      break;
    case 'inline':
      positionStyles = 'w-full h-[180px] md:h-[120px]';
      break;
    default:
      positionStyles = 'w-full max-w-[300px] h-[250px]';
  }

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${positionStyles} ${className}`}
      onClick={handleAdClick}
    >
      <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 rounded-tl-sm">
        Ad
      </div>
      {ad.imageUrl && (
        <div className="w-full h-full overflow-hidden">
          <img 
            src={ad.imageUrl} 
            alt={ad.name} 
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
    </Card>
  );
};

export default Advertisement;