using Newtonsoft.Json.Linq;
using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace StreamDanmukuClient
{
    internal class Program
    {
        static string Server = "http://81.70.253.198:62353/";
        static string TargetIP = "";
        static string SelfIP = "";
        static bool Connected = false;
        static bool GainIP = false;
        static string host;
        static int port;
        static int LoseConnectionTime = 0;
        static UdpClient udp;
        static Thread HeartBeatThread;
        static Thread ConntionCheckThread;
        static void Main(string[] args)
        {
            //SelfIP = Query();
            //if(string.IsNullOrWhiteSpace(SelfIP))
            //{
            //    Console.Write("请输入要登记的用户名：");
            //    string name = Console.ReadLine();
            //    Record(name);
            //}
            //else
            //{
            //    Console.WriteLine("本地IP已被服务器记录");
            //}
            //string[] self = SelfIP.Split(':');
            //Console.WriteLine("本机是服务器或客户端？[1/2]");
            //switch (Console.ReadLine())
            //{
            //    case "1":
            //        TcpListener tcpListener = new(new IPEndPoint(IPAddress.Loopback, 8634));
            //        Console.WriteLine($"连接已建立，地址：{self[0]}:{self[1]}\n等待客户端连接……");
            //        tcpListener.Start();
            //        TcpClient client = tcpListener.AcceptTcpClient();
            //        Console.WriteLine("连接成功");
            //        NetworkStream serverStream = client.GetStream();
            //        new Thread(() =>
            //        {
            //            byte[] data = new byte[65535];
            //            while (true)
            //            {
            //                try
            //                {
            //                    int c = serverStream.Read(data, 0, data.Length);
            //                    Console.WriteLine($"\n[{DateTime.Now.ToLongTimeString()}]Client：{Encoding.UTF8.GetString(data, 0, c)}");
            //                }
            //                catch
            //                {
            //                    serverStream.Close();
            //                    Console.WriteLine("连接意外中断，单击任意键退出程序……");
            //                    Console.ReadKey();
            //                }
            //            }
            //        }).Start();
            //        while (true)
            //        {
            //            if (serverStream.CanWrite)
            //            {
            //                string text = Console.ReadLine();
            //                var b = Encoding.UTF8.GetBytes(text);
            //                serverStream.Write(b, 0, b.Length);
            //            }
            //        }
            //    case "2":
            //        Console.Write("请输入服务器IP：");
            //        TargetIP = Console.ReadLine();
            //        string host = TargetIP.Split(':')[0];
            //        int port = int.Parse(TargetIP.Split(':')[1]);
            //        //UdpClient udp = new(new IPEndPoint(IPAddress.Any, 8634));
            //        Console.WriteLine("按回车开始连接");
            //        Console.ReadLine();
            //        TcpClient tcpClient = new(host, port);
            //        Console.WriteLine("与主机建立连接");
            //        NetworkStream clientStream = tcpClient.GetStream();
            //        byte[] data = new byte[65535];
            //        new Thread(() =>
            //        {
            //            while (true)
            //            {
            //                if (clientStream.CanWrite)
            //                {
            //                    string text = Console.ReadLine();
            //                    var b = Encoding.UTF8.GetBytes(text);
            //                    clientStream.Write(b, 0, b.Length);
            //                }
            //            }
            //        }).Start();
            //        while (true)
            //        {
            //            try
            //            {
            //                int c = clientStream.Read(data, 0, data.Length);
            //                Console.WriteLine($"\n[{DateTime.Now.ToLongTimeString()}]Server：{Encoding.UTF8.GetString(data, 0, c)}");
            //            }
            //            catch
            //            {
            //                clientStream.Close();
            //                Console.WriteLine("连接意外中断，单击任意键退出程序……");
            //                Console.ReadLine();
            //                Environment.Exit(0);
            //            }
            //        }
            //        break;
            //    default:
            //        break;
            //}
            //TargetIP = Query(target);
            //if (TargetIP == null)
            //{
            //    Console.WriteLine("未查询到ip，请等待对方登记完成");
            //    return;
            //}
            Console.Write("输入本地监听端口 默认6235端口：");
            string tmp = Console.ReadLine();
            int port = string.IsNullOrWhiteSpace(tmp) ? 6235 : int.Parse(tmp);
            udp = new UdpClient(new IPEndPoint(IPAddress.Any, port));
            new Thread(() =>
            {
                //IPEndPoint object will allow us to read datagrams sent from any source.
                IPEndPoint RemoteIpEndPoint = null;
                while (true)
                {
                    // Blocks until a message returns on this socket from a remote host.
                    byte[] receiveBytes = udp.Receive(ref RemoteIpEndPoint);
                    var returnData = Encoding.UTF8.GetString(receiveBytes).Split("|||");
                    string response = returnData[0];
                    long span = 0;
                    if (returnData.Length > 1)
                        span = Math.Abs(GetTimeStamp() - long.Parse(returnData[1]));
                    if (!Connected && (response == "Request..." || response == "ReceiveRequest"))
                    {
                        Connected = true;
                        TargetIP = RemoteIpEndPoint.Address + ":" + RemoteIpEndPoint.Port;
                        host = TargetIP.Split(':')[0];
                        port = int.Parse(TargetIP.Split(':')[1]);

                        Console.WriteLine($"与{RemoteIpEndPoint.Address}:{RemoteIpEndPoint.Port}主机建立连接");
                        SendMsg("ReceiveRequest", host, port);
                        HeartBeat(host, port);
                        continue;
                    }
                    else if (!Connected && response.StartsWith("ClientIP: "))
                    {
                        GainIP = true;
                        SelfIP = response.Replace("ClientIP: ", "");
                        Console.WriteLine($"收到UDP服务器响应，公网IP: {SelfIP}");
                    }
                    else if (Connected && response == "#HEARTBEAT#")
                    {
                        Console.WriteLine("Receive Heatbeat");
                        LoseConnectionTime = 0;
                    }
                    else
                    {
                        Console.WriteLine($"对方回应：{response} 延时：{span}ms");
                    }
                }
            }).Start();

            Console.WriteLine("发出公网IP响应请求，等待公共服务器响应...");
            while (true)
            {
                if (GainIP)
                    break;
                SendMsg("Query IP", "81.70.253.198", 62352);
                Thread.Sleep(1000);
            }
            while (true)
            {
                if (string.IsNullOrWhiteSpace(SelfIP) is false)
                    break;
                Thread.Sleep(100);
            }
            Console.WriteLine("是否需要发起连接[1/2]：");
            bool noConnect = true;
            if (Console.ReadLine() == "1")
            {
                noConnect = false;
                Console.Write("请输入另一主机IP：");
                TargetIP = Console.ReadLine();
                host = TargetIP.Split(':')[0];
                port = int.Parse(TargetIP.Split(':')[1]);

                Console.WriteLine("按回车开始连接");
                Console.ReadLine();
            }
            int count = 1;
            new Thread(() =>
            {
                while (true)
                {
                    if (Connected)
                    {
                        SendMsg(Console.ReadLine(), host, port);
                        continue;
                    }
                    else if (!noConnect)
                    {
                        Console.WriteLine($"第{count}次连接……");
                        byte[] sendBytes = Encoding.UTF8.GetBytes("Request...");
                        udp.Send(sendBytes, sendBytes.Length, host, port);
                        Thread.Sleep(1000);
                        count++;
                    }
                    Thread.Sleep(100);
                }
            }).Start();

        }
        public static void SendMsg(string msg, string ip, int port)
        {
            byte[] buffer = Encoding.UTF8.GetBytes(msg + $"|||{GetTimeStamp()}");
            udp.Send(buffer, buffer.Length, new IPEndPoint(IPAddress.Parse(ip), port));
        }
        public static void HeartBeat(string ip, int port)
        {
            if (HeartBeatThread != null)
                HeartBeatThread.Interrupt();
            if (ConntionCheckThread != null)
                ConntionCheckThread.Interrupt();
            HeartBeatThread = new Thread(() =>
            {
                Console.WriteLine($"心跳线程开启...");
                while (true && Connected)
                {
                    SendMsg("#HEARTBEAT#", ip, port);
                    Thread.Sleep(1000 * 10);
                }
            });
            HeartBeatThread.Start();
            ConntionCheckThread = new Thread(() =>
            {
                while (true && Connected)
                {
                    if (LoseConnectionTime == 300)
                    {
                        Console.WriteLine("似乎与对方失去了连接");
                        LoseConnectionTime = 0;
                        Connected = false;
                    }
                    LoseConnectionTime++;
                    Thread.Sleep(100);
                }
            });
            ConntionCheckThread.Start();
        }
        public static long GetTimeStamp()
        {
            var a = DateTime.Now - new DateTime(1970, 1, 1, 0, 0, 0);
            return (long)a.TotalMilliseconds;
        }
        static bool Record(string name)
        {
            using var http = new WebClient();
            JObject json = JObject.Parse(http.DownloadString(Server + $"anonymous/Record?name={name}"));
            Console.WriteLine(json.ToString());
            bool flag = json["code"].ToObject<int>() == 200;
            if (flag)
                Console.WriteLine($"记录成功，本机外网IP：{json["data"]}");
            else
                Console.WriteLine($"记录失败，原因：{json["msg"]}");
            return flag;
        }
        static string Query(string name = "")
        {
            using var http = new WebClient();
            string url = Server + "anonymous/Query";
            if (string.IsNullOrWhiteSpace(name) is false)
                url += $"?name={name}";
            JObject json = JObject.Parse(http.DownloadString(url));
            Console.WriteLine(json.ToString());
            bool flag = json["code"].ToObject<int>() == 200;
            if (flag)
            {
                Console.WriteLine($"查询成功，外网IP：{json["data"]}");
                return json["data"].ToString();
            }
            else
            {
                Console.WriteLine($"查询失败，原因：{json["msg"]}");
                return null;
            }
        }
    }
}
