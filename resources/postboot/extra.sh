## OLD VALETUDO STARTUP REMOVED ##

## NEW CONTENT BELOW ##

# Disable IPv6
echo 1 > /proc/sys/net/ipv6/conf/all/disable_ipv6
echo 1 > /proc/sys/net/ipv6/conf/default/disable_ipv6

## Start vacuumstreamer
if [[ -f /data/valetudo/streamer/video_monitor ]]; then
  mount --bind /data/valetudo/streamer/video_monitor-conf /ava/conf/video_monitor
  mount --bind /data/valetudo/streamer/mnt_private-copy /mnt/private

  LD_PRELOAD=/data/valetudo/streamer/vacuumstreamer.so /data/valetudo/streamer/video_monitor > /dev/null 2>&1 &
  /data/valetudo/streamer/go2rtc -c /data/valetudo/streamer/go2rtc.yaml > /dev/null 2>&1 &
fi

# Start Valetudo
if [[ -f /data/valetudo/valetudo ]]; then
  VALETUDO_DATA_PATH=/data/valetudo /data/valetudo/valetudo > /dev/null 2>&1 &
fi

# Add firewall rules after a delay (this ensures they are actually applied and adds a small window to get in if a rule causes issues)
sleep 30

/usr/sbin/iptables -A INPUT -p tcp --dport 22 -j ACCEPT # SSH
/usr/sbin/iptables -A INPUT -p tcp --dport 80 -j ACCEPT  # HTTP
/usr/sbin/iptables -A INPUT -p tcp --dport 443 -j ACCEPT # HTTPS
#/usr/sbin/iptables -A INPUT -p udp --dport 5353 -j ACCEPT # mDNS
/usr/sbin/iptables -A INPUT -p tcp --dport 8554 -j ACCEPT # RTSP
/usr/sbin/iptables -A INPUT -p tcp --dport 8555 -j ACCEPT # WebRTC
/usr/sbin/iptables -A INPUT -p udp --dport 8555 -j ACCEPT # WebRTC
/usr/sbin/iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
/usr/sbin/iptables -A INPUT -i lo -j ACCEPT
/usr/sbin/iptables -P INPUT DROP