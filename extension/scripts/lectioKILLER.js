// Kører i main world, har adgang til lectio js funktioner
// I nogle tilfælde bliver lectio scripts indlæst, her slettes de værste funktioner

window.addEventListener("load", function(){
    delete SessionHelper;
    delete LectioPageOps;
})