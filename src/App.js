import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import { Card,CardContent,Typography, Grid ,FormControl,Select,Button,MenuItem,InputLabel,Stack,Paper} from '@mui/material';
import axios from 'axios';
import * as d3 from 'd3';
import { useRef } from 'react'; 
import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { group } from 'd3-array';



function App() {


  const chartContainerRef = useRef(null);
  const[end_year,setendyears]=useState([]);
  const[city,setcity]=useState([]);
  const[country,setcountry]=useState([]);
  const[sector,setsector]=useState([]);
  const[region,setregion]=useState([]);
  const[pestle,setpestle]=useState([]);
  const[swot,setswot]=useState([]);
  const[source,setsource]=useState([]);
  const[topic,settopic]=useState([]);
  const [year,setyear]=useState(0);
  const [filtercity,setfiltercity]=useState(null);
  const [filterscouce,setfiltersource]=useState(null);
  const [filtercountry,setfiltercountry]=useState(null);
  const [filterswot,setfilterswot]=useState(null);
  const [filterregion,setfilterregion]=useState(null);
  const [filterpestle,setfilterpestle]=useState(null);
  const [filtertopic,setfiltertopic]=useState(null);
  const [filtersector,setfiltersector]=useState(null);
  const [resetfilter,setresetfilter]=useState(null);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [Data,setData]=useState([]);
  const [page, setPage] = React.useState(0);
  const [dataPerPage, setdataPerPage] = React.useState(6);
  const [currentPage,setCurrentPage] = React.useState(1);
  const lastIndex = currentPage * dataPerPage;
  const firstIndex = lastIndex - dataPerPage;
  const currentData = Data && Data?.slice(firstIndex,lastIndex);
  const totalPages = Math.ceil(Data?.length/dataPerPage);
  const pieChartContainerRef = useRef(null);


  
   React.useEffect(() => {  
    GetAllData()
    handlechange ()
    },[])
  
   //Integreted get all data Api with axios 
   const GetAllData= () => 
   {
     axios.get('http://localhost:8081/Factors/Factors')  
     .then(response =>
     {
      setData(response.data);
     
     })
     .catch(err=>
     {
      console.log(err.message)
     })
   }

    //Integreted Filter Api with axios 
  const handlechange = () => {
    axios.get('http://localhost:8081/Factors/Filter',
     {
       params:
      {
        end_year: year,
        city:filtercity,
        country:filtercountry,
        sector:filtersector,
        source:filterscouce,
        swot:filterswot,
        region:filterregion,
        pestle:filterpestle,
        topic:filtertopic,
      },
    })
      .then(response => {
        setData(response.data);
        
        
        // to check whether filter applied or not 
        setIsFilterApplied(
          year || filtercity ||  filtercountry || filtersector || filterscouce ||filterswot ||
          filterregion || filterpestle || filtertopic
        );
        
      })
      .catch(error => {
        console.error('Error fetching filtered data:', error);
      });
     
   };
 


   React.useEffect(() => {

   if (Data && Data.length > 0) {
    const container = d3.select(chartContainerRef.current);
          container.selectAll('*').remove();

    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Group and aggregate data by end_year
    const aggregatedData = group(Data, d => d.end_year);
    const years = Array.from(aggregatedData.keys());

    const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
     // Calculate total relevance for each year
    const totalRelevanceByYear = Array.from(aggregatedData, ([year, data]) => ({
      year,
      totalRelevance: d3.sum(data, d => d.relevance),
    }));
  
     const maxRelevance = d3.max(totalRelevanceByYear, d => d.totalRelevance);
     const xScale = scaleBand()
      .domain(years)
      .range([4, width])
      .padding(0.1);
  
    // Rotate the x-axis labels for better readability
    svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(axisBottom(xScale))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-0.8em')
    .attr('dy', '-0.15em')
    .attr('transform', 'rotate(-65)');
  
     const yScale = scaleLinear()
      .domain([0, maxRelevance])
      .range([height, 0]);
  
    // Create bars
    svg.selectAll('.bar')
    .data(totalRelevanceByYear)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.totalRelevance))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.totalRelevance));
  
     // Y-axis
    svg.append('g')
     .call(axisLeft(yScale));
    

 

    // Create the pie chart for Pestle values
     const pestleData = Array.from(
     group(Data, d => d.pestle),
     ([pestle, data]) => ({
      pestle,
     count: data.length,
    })
   );

    const pie = d3.pie().value(d => d.count);
    const pieData = pie(pestleData);
    const pieContainer = d3.select(pieChartContainerRef.current);
    pieContainer.selectAll('*').remove();
    const pieWidth = 400;
    const pieHeight = 500;
    const radius = Math.min(pieWidth, pieHeight) / 2;

    const pieSvg = pieContainer
     .append('svg')
     .attr('width', pieWidth)
     .attr('height', pieHeight)
     .append('g')
     .attr('transform', `translate(${pieWidth / 2},${pieHeight / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);

     // Add labels to the pie chart
    const labelArc = d3.arc().innerRadius(radius * 0.8).outerRadius(radius * 0.8);

    const slices = pieSvg
    .selectAll('path')
    .data(pieData)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => color(i))
    .attr('stroke', 'white')
    .style('stroke-width', '2px');

    // Add labels with pestle names
    slices.each(function (d) {
    const centroid = labelArc.centroid(d);
    const x = centroid[0];
    const y = centroid[1];
  
    pieSvg
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('dy', '0.25em')
    .text(d.data.pestle)
    .style('text-anchor', 'middle')
    .style('fill', 'black')
    .style('font-size', '12px');
   });}
   }, [Data]);

  
    
   React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endyear')
      .then(response => {
        setendyears(response.data);
        })
      .catch(error => {
        console.error('Error fetching distinct end years:', error);
      });
    }, []);
   React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endtopic')
      .then(response => {
        settopic(response.data);
        
      })
      .catch(error => {
        console.error('Error fetching :', error);
      });
    }, []);
   React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endsector')
      .then(response => {
        setsector(response.data);
        
      })
      .catch(error => {
        console.error('Error fetching :', error);
      });
    }, []);
   React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endsource')
      .then(response => {
        setsource(response.data);
       
      })
      .catch(error => {
        console.error('Error fetching :', error);
      });
    }, []);
   React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endcity')
      .then(response => {
        setcity(response.data);
      
      })
      .catch(error => {
        console.error('Error fetching :', error);
      });
   }, []);
  React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endcountry')
      .then(response => {
        setcountry(response.data);
        
      })
      .catch(error => {
        console.error('Error fetching :', error);
      });
  }, []);
  React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endswot')
      .then(response => {
        setswot(response.data);
       
      })
      .catch(error => {
        console.error('Error fetching: ', error);
      });
  }, []);
  React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endpestle')
      .then(response => {
        setpestle(response.data);
       
      })
      .catch(error => {
        console.error('Error fetching :', error);
      });
  }, []);
  React.useEffect(() => {
    axios.get('http://localhost:8081/Factors/endregion')
      .then(response => {
        setregion(response.data);
       
      })
      .catch(error => {
        console.error('Error fetching :', error);
      });
    }, []);
  const handleendyer = (event) => {
  setyear(event.target.value); };

  const handlecity = (event) => {
  setfiltercity(event.target.value); };

  const handleregion = (event) => {
  setfilterregion(event.target.value); }; 

  const handlecountry = (event) => {
  setfiltercountry(event.target.value); };  

  const handlesector = (event) => {
  setfiltersector(event.target.value); };  

  const handlesource = (event) => {
  setfiltersource(event.target.value); }; 

  const handletopic = (event) => {
  setfiltertopic(event.target.value); }; 

  const handlepestle = (event) => {
  setfilterpestle(event.target.value); };
   
  const handleswot = (event) => {
  setfilterswot(event.target.value); }; 

  const PreviousPage= (event) =>{
      if(currentPage>1){
        setCurrentPage(currentPage-1);
      } }

  const NextPage = (event) =>{
    if(currentPage<totalPages){
    if(currentPage < currentPage+1){
      setCurrentPage(currentPage+1);
    }}}
  const handleReset = () => {
    setyear(0);
    setfiltercity(null);
    setfiltercountry(null);
    setfiltersector(null);
    setfiltersource(null);
    setfilterswot(null);
    setfilterregion(null);
    setfilterpestle(null);
    setfiltertopic(null);
    setresetfilter(Date.now()); // This triggers a re-render to reset the form fields
    setIsFilterApplied(false);
    GetAllData();
  };
  
  return (
  <>
   
    <div style={{ marginBottom: 20, backgroundColor: 'black', minHeight: 80, paddingTop: 20,paddingLeft:10 }}>
        <Stack direction='row' spacing={8}>

              <div>
                 <Box>
                    <FormControl sx={{  width: 150}}>
                      <InputLabel  style={{backgroundColor:'white' }}>End_Year</InputLabel>
                        <Select
                           value={year} 
                           onChange={handleendyer}
                           style={{backgroundColor:"white"}}>
                           {end_year.map(year => (
                           <MenuItem key={year} value={year}>{year}</MenuItem>))}
                        </Select>
                    </FormControl>
                 </Box>
                </div>


                <div className="mx-3">
                  <Box sx={{ minWidth: 200 , border: '1px solid #DDD', maxHeight:47}}>
                    <FormControl fullWidth>
                      <InputLabel  style={{backgroundColor:'white' }}>Topic </InputLabel>
                         <Select 
                            style={{backgroundColor:"white"}}
                            value={filtertopic}
                            onChange={handletopic}>
                                {
                                  topic.map(topics => (<MenuItem key={topics} value={topics}>{topics}</MenuItem>
                               ))}
                          </Select>
                     </FormControl>
                   </Box>
                 </div>


                <div className="mx-3">
                  <Box sx={{ minWidth: 200 , border: '1px solid #DDD', maxHeight:47}}>
                    <FormControl fullWidth>
                      <InputLabel  style={{backgroundColor:'white' }}>Sector</InputLabel>
                      <Select
                        style={{backgroundColor:"white"}}
                        value={filtersector}
                        onChange={handlesector}>
                          {
                            sector.map(sector=> (<MenuItem key={sector} value={sector}>{sector}</MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                </div>


                <div className="mx-3">
                  <Box sx={{ minWidth: 200 , border: '1px solid #DDD', maxHeight:47}}>
                    <FormControl fullWidth>
                      <InputLabel style={{backgroundColor:'white' }}>Swot</InputLabel>
                      <Select
                        value={filterswot}
                        onChange={handleswot}
                        style={{backgroundColor:"white"}}>
                          {
                            swot.map(swot=> (<MenuItem key={swot} value={swot}>{swot}</MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                </div>


                <div className="mx-3">
                  <Box sx={{ minWidth: 200 , maxHeight:47}}>
                     <FormControl sx={{  width: 250}}>
                       <InputLabel  style={{backgroundColor:'white' }}>Region</InputLabel>
                       <Select
                         value={filterregion}
                         onChange={handleregion}
                         style={{backgroundColor:"white"}} >
                           {region.map(region => (
                               <MenuItem key={region} value={region}>{region}</MenuItem>
                           ))}
                       </Select>
                       </FormControl>
                 </Box>
                </div>
               
         </Stack>
      </div>



       <div style={{ minHeight: 80, marginBottom: 20, backgroundColor: 'black', paddingTop: 20,paddingLeft:10 }}>
          <Stack direction='row' spacing={6}>

               <div>
                   <Box>
                    <FormControl sx={{  width: 150}}>
                        <InputLabel  style={{backgroundColor:'white' }}>City </InputLabel>
                        <Select
                              value={filtercity}
                              onChange={handlecity}
                              style={{backgroundColor:"white"}}>
                                {
                                  city.map(city => (<MenuItem key={city} value={city}>{city}</MenuItem>
                               )) }
                        </Select>
                      </FormControl>
                  </Box>
                </div>


                <div className="mx-3">
                   <Box sx={{ minWidth: 200 , border: '1px solid #DDD', maxHeight:47}}>
                      <FormControl fullWidth>
                          <InputLabel  style={{backgroundColor:'white' }}>Country</InputLabel>
                             <Select
                               value={filtercountry}
                               onChange={handlecountry}
                               style={{backgroundColor:"white"}}>
                               {
                                 country.map(country=> (<MenuItem key={country} value={country}>{country}</MenuItem>
                                ))}
                           </Select>
                         </FormControl>
                  </Box>
                </div>


                <div className="mx-3">
                  <Box sx={{ minWidth: 200 , border: '1px solid #DDD', maxHeight:47}}>
                    <FormControl fullWidth>
                      <InputLabel  style={{backgroundColor:'white' }}>Pestle</InputLabel>
                      <Select
                        value={filterpestle}
                        onChange={handlepestle}
                        style={{backgroundColor:"white"}}
                       >
                          {
                            pestle.map(pestle=> (<MenuItem key={pestle} value={pestle}>{pestle}</MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                </div>


                <div className="mx-3">
                  <Box sx={{ minWidth: 200 , border: '1px solid #DDD', maxHeight:47}}>
                    <FormControl fullWidth>
                      <InputLabel  style={{backgroundColor:'white' }}>Source</InputLabel>
                      <Select
                        value={filterscouce}
                        onChange={handlesource}
                        style={{backgroundColor:"white"}} >
                          {
                            source.map(source=> (<MenuItem key={source} value={source}>{source}</MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                </div>


                <div className="mx-3">
                  <Button  style={{color: "black",backgroundColor:"green",minWidth: 150 ,height:57}} onClick={handlechange}>
                  Search Data
                  </Button>
                </div>


                <div className="mx-3">
                  <Button  style={{color: "black",backgroundColor:"red",minWidth: 150 ,height:57}} onClick={handleReset}>
                  Reset
                  </Button>
                </div>
               
      </Stack>
     </div>

   
        {/* Button to scroll down */}
      <div align="center">
          <Button variant="contained" style={{ marginTop: '20px' ,backgroundColor:"black",color:"white"}}
             onClick={() => {
             const pieChartSection = document.getElementById('pie-chart-section');
             if (pieChartSection) 
               {
                 pieChartSection.scrollIntoView({ behavior: 'smooth' });
               }
            }} >
           Click here  Visualize Data
         </Button>
      </div>



      {/* div for align data from database  */}
      <div align="center">
           <Box sx={{ width: "95%", paddingTop: 3 }}>
               <div align="center">
                   <Typography fontSize={20}>{isFilterApplied ? "FILTERED DATA" : "ALL DATA"}</Typography>
               </div>

                    {/* Iterate through the data */}
             <Grid container spacing={2}>
                  {currentData?.map(data => (
                       <Grid item xs={4} key={data.data_id}>
                           <Paper elevation={6} sx={{ padding: 2, maxWidth: 350, margin: "0 auto", overflow: "auto" }}>
                                   <div style={{ textAlign: "left" }}>
                                   <Typography >
                                     <span style={{ fontWeight: 'bold' ,backgroundColor:'grey',padding:6,borderRadius:"10px"}}>End Year:</span> {data.end_year}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>City Longitude:</span> {data.citylng}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>City Latitude:</span> {data.citylat}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Intensity:</span> {data.intensity}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold',backgroundColor:'yellow',padding:6 ,borderRadius:"10px"}}>Topic:</span> {data.topic}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Insights:</span> {data.insight}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' ,backgroundColor:'green',padding:6,borderRadius:"10px"}}>Swot:</span> {data.swot}
                                                        </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>URL:</span> {data.url}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' ,backgroundColor:'purple',padding:6,borderRadius:"10px"}}>Region:</span> {data.region}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Start Year:</span> {data.start_year}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Impact:</span> {data.impact}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Added On:</span> {data.added}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Published On:</span> {data.published}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold',backgroundColor:'pink',padding:6,borderRadius:"10px" }}>City:</span> {data.city}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold',backgroundColor:'violet',padding:6,borderRadius:"10px" }}>Country:</span> {data.country}
                                   </Typography >
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Relevance:</span> {data.relevance}
                                   </Typography>
                                   <Typography    style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold',backgroundColor:'red',padding:6,borderRadius:"10px" }}>Pestle:</span> {data.pestle}
                                   </Typography>
                                   <Typography style={{paddingTop:8}} >
                                     <span style={{ fontWeight: 'bold',backgroundColor:'blue',padding:6 ,borderRadius:"10px"}}>Source:</span> {data.source}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Title:</span> {data.title}
                                   </Typography>
                                   <Typography style={{paddingTop:8}}>
                                     <span style={{ fontWeight: 'bold' }}>Likelihood:</span> {data.likelihood}
                                   </Typography>
                                 </div>
                              </Paper>
                        </Grid>
                     ))}
                  </Grid>
                   

                   {/* to set pagination  */}
                  {Data?.length === 0 ? 
                              (
                      <div align="center">
                      <h5>No data Available!!!</h5>
                      </div>
                   )
                    : 
                   (
                      <div align="center" style={{paddingTop:40}} >
                      <Button  style={{ height:50,width:100,backgroundColor:"black" ,color:"white"}} onClick={PreviousPage}>Prev</Button>
                       <span style={{paddingLeft:30,paddingRight:30}}>Page {currentPage}</span>
                      <Button  style={{ height:50,width:100,backgroundColor:"black" ,color:"white"}} onClick={NextPage}>Next</Button>
                     </div>
                  )}
        </Box>
     </div>


     {/* New div for bar and pie  */}
      <div>   
        <Box sx={{ width: "95%", paddingTop: 10,paddingLeft:13 }}>
            <div>
                <Stack direction="row" spacing={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Bar Chart -Total Relevance per year</Typography>
                      <div ref={chartContainerRef}></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Pie Chart -Pestle values ratio for filtered data </Typography>
                      <div id="pie-chart-section" ref={pieChartContainerRef}></div>
                    </CardContent>
                  </Card>
                </Stack>
             </div>
         </Box>
      </div>
  </>
  );
}

export default App;
