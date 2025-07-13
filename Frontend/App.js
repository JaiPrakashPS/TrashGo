import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Font from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";


import ComplaintsPage from "./routes/Labour/ComplaintsPage";  
import LabourHome from "./routes/Labour/LabourHome"; 
import ComplaintDetails from "./routes/Labour/ComplaintDetails";  
import LabourProfile from "./routes/Labour/LabourProfile";  
import LabourLogin from "./routes/Labour/LabourLogin";
import AllottedAreas from "./routes/Labour/AllottedAreas";
import TripScreen from "./routes/Labour/TripScreen";

// ✅ User-related screens
import Selectingrole from "./routes/Selectingrole";  
import Startingpage from "./routes/Startingpage";
import Userlogin from "./routes/User/Userlogin";
import UserRegister from "./routes/User/UserRegister";
import UserDetails from "./routes/User/UserDetails"; 
import UserHomePage from "./routes/User/UserHomePage"; 
import UserProfile from "./routes/User/UserProfile";
import MapScreen from "./routes/User/MapScreen"; 
import Complaint from "./routes/User/Complaint"; 

// ✅ Incharger-related screens
import Inchargerlogin from "./routes/Incharger/Inchargerlogin";
import InchargerRegister from "./routes/Incharger/InchargerRegister";
import InchargerDetails from "./routes/Incharger/InchargerDetails";
import InchargerHomePage from "./routes/Incharger/InchargerHomePage";
import InchargerProfile from "./routes/Incharger/InchargerProfile";
import AllotWork from "./routes/Incharger/AllotWork";
import AddLabour from "./routes/Incharger/AddLabour";
import ViewComplaints from "./routes/Incharger/ViewComplaints";
import Homescreen from './routes/Map/screen/Homescreen';
import RecentComplaints from "./routes/User/RecentComplaints";
import InchargerAI from "./routes/Incharger/InchargerAI";
import AllottedLabourDetails from "./routes/Incharger/AllottedLabourDetails";
import InchargerComplaints from "./routes/Incharger/Inchargercomplaints";
import AllotWorkComplaints from "./routes/Incharger/AllotWorkComplaints";
import UserDetailsPage from "./routes/Incharger/UserDetailsPage";
import PointsScreen from "./routes/User/PointsScreen";
import BuyProduct from "./routes/User/BuyProduct";


// ✅ Drawer Navigation Placeholder (Replace with your actual component)


const Stack = createStackNavigator();

export default function App() {
  const [fontLoaded, setFontLoaded] = useState(false);

  const loadFonts = useCallback(async () => {
    try {
      await Font.loadAsync({
        "LuckiestGuy": require("./assets/fonts/LuckiestGuy-Regular.ttf"),
      });
      setFontLoaded(true);
    } catch (error) {
      console.error("Error loading fonts:", error);
    }
  }, []);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  if (!fontLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6BBE44" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Authentication and User Flow */}
        <Stack.Screen name="startpage" component={Startingpage} />
        <Stack.Screen name="selectingrole" component={Selectingrole} />
        <Stack.Screen name="userlogin" component={Userlogin} />
        <Stack.Screen name="userregister" component={UserRegister} />
        <Stack.Screen name="userdetails" component={UserDetails} /> 
        <Stack.Screen name="userhomepage" component={UserHomePage} />
        <Stack.Screen name="userprofile" component={UserProfile} />
        <Stack.Screen name="mapscreen" component={MapScreen} /> 
        <Stack.Screen name="complaint" component={Complaint} /> 
        <Stack.Screen name="recentcomplaints" component={RecentComplaints} /> 
        <Stack.Screen name="inchargerai" component={InchargerAI} /> 
        <Stack.Screen name="allottedlabourdetails" component={AllottedLabourDetails} /> 
        <Stack.Screen name="points" component={PointsScreen} /> 
        <Stack.Screen name="buyproduct" component={BuyProduct} /> 
        


         



        {/* Incharger Authentication */}
        <Stack.Screen name="Inchargerlogin" component={Inchargerlogin} />
        <Stack.Screen name="InchargerRegister" component={InchargerRegister} />
        <Stack.Screen name="InchargerDetails" component={InchargerDetails} />
        <Stack.Screen name="InchargerHomePage" component={InchargerHomePage} />
        <Stack.Screen name="InchargerProfile" component={InchargerProfile} />
        <Stack.Screen name="allotwork" component={AllotWork} />
        <Stack.Screen name="addlabours" component={AddLabour} />
        <Stack.Screen name="viewcomplaints" component={ViewComplaints} />
        <Stack.Screen name="InchargerComplaints" component={InchargerComplaints} /> 
        <Stack.Screen name="allotworkcomplaints" component={AllotWorkComplaints} />
        <Stack.Screen name="userdetailspage" component={UserDetailsPage} />


        <Stack.Screen name="Home" component={Homescreen} options={{ title: "GPS Tracker" }} />

        <Stack.Screen name="labourlogin" component={LabourLogin} />
        <Stack.Screen name="complaintspage" component={ComplaintsPage} />
        <Stack.Screen name="labourhome" component={LabourHome} />
        <Stack.Screen name="complaintdetails" component={ComplaintDetails} />
        <Stack.Screen name="labourprofile" component={LabourProfile} />
        <Stack.Screen name="allottedareas" component={AllottedAreas} />
        <Stack.Screen name="tripscreen" component={TripScreen} />
   
        {/* Incharger Dashboard with Drawer Navigation */}
        {/* <Stack.Screen name="InchargerDashboard" component={InchargerDrawerNavigator} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
