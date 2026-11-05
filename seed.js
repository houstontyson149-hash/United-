const A=(iata,name,city,country='US')=>({iata,name,city,country});
exports.airports=[
A('ORD','O\'Hare International','Chicago'),A('DEN','Denver International','Denver'),A('IAH','George Bush Intercontinental','Houston'),
A('EWR','Newark Liberty International','Newark'),A('SFO','San Francisco International','San Francisco'),A('IAD','Washington Dulles International','Washington'),
A('LAX','Los Angeles International','Los Angeles'),A('JFK','John F. Kennedy International','New York'),A('LGA','LaGuardia','New York'),
A('BOS','Logan International','Boston'),A('MIA','Miami International','Miami'),A('ATL','Hartsfield-Jackson International','Atlanta'),
A('DFW','Dallas/Fort Worth International','Dallas'),A('SEA','Seattle-Tacoma International','Seattle'),A('PHX','Phoenix Sky Harbor','Phoenix'),
A('LAS','Harry Reid International','Las Vegas'),A('MCO','Orlando International','Orlando'),A('SAN','San Diego International','San Diego'),
A('PDX','Portland International','Portland'),A('SLC','Salt Lake City International','Salt Lake City'),A('CLE','Cleveland Hopkins International','Cleveland'),
A('PHL','Philadelphia International','Philadelphia'),A('MSP','Minneapolis-St. Paul International','Minneapolis'),A('DTW','Detroit Metropolitan','Detroit'),
A('HNL','Daniel K. Inouye International','Honolulu'),A('ANC','Ted Stevens Anchorage International','Anchorage'),A('LHR','Heathrow','London','GB'),
A('CDG','Charles de Gaulle','Paris','FR'),A('FRA','Frankfurt Airport','Frankfurt','DE'),A('NRT','Narita International','Tokyo','JP'),
A('HND','Haneda','Tokyo','JP'),A('SYD','Sydney Kingsford Smith','Sydney','AU'),A('MEX','Benito Juárez International','Mexico City','MX'),
A('CUN','Cancún International','Cancún','MX'),A('YYZ','Toronto Pearson International','Toronto','CA'),A('GRU','São Paulo–Guarulhos','São Paulo','BR')];
const F=(id,name,mfr,seats)=>({id,name,manufacturer:mfr,seats});
exports.fleet=[
F('B738','Boeing 737-800','Boeing',166),F('B739','Boeing 737-900ER','Boeing',179),F('B38M','Boeing 737 MAX 8','Boeing',166),
F('B39M','Boeing 737 MAX 9','Boeing',179),F('B752','Boeing 757-200','Boeing',169),F('B763','Boeing 767-300ER','Boeing',214),
F('B772','Boeing 777-200','Boeing',364),F('B788','Boeing 787-8','Boeing',234),F('B789','Boeing 787-9','Boeing',252),F('B78X','Boeing 787-10','Boeing',318),
F('A319','Airbus A319','Airbus',126),F('A320','Airbus A320','Airbus',150),F('A21N','Airbus A321neo','Airbus',200),F('E175','Embraer E175','Embraer',76)];
