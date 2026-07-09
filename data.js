const CITIES=[
{name:"Sylvera",area:"Hof des Mondes",icon:"🌙",x:908,y:91,discord:"https://discord.com/channels/1514984333344112811/1518861674579230800"},
{name:"Ebonvale",area:"Hof der Nacht",icon:"🌑",x:1318,y:88,discord:"https://discord.com/channels/1514984333344112811/1518860134129078395"},
{name:"Amaranthia",area:"Hof der Vier Jahreszeiten",icon:"🌸",x:1293,y:409,discord:"https://discord.com/channels/1514984333344112811/1518888878390382632"}
];

const ROUTES=[
{from:"Sylvera",to:"Ebonvale",type:"air",points:[[908,91],[1080,55],[1318,88]]},
{from:"Ebonvale",to:"Amaranthia",type:"land",points:[[1318,88],[1340,190],[1293,409]]},
{from:"Sylvera",to:"Amaranthia",type:"land",points:[[908,91],[1010,220],[1140,330],[1293,409]]}
];
