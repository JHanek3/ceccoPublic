import os
import numpy as np
from datetime import date
import pandas as pd
    
# Recursivly get all Files and Folders in a specific directory
def GetAllInFolder(path):
    basepath = path
    full_file_path = []
    
    for path, currentDirectory, files in os.walk(path):
        for file in files:
            full_file_path.append(os.path.join(path, file))

    relative_file_path = []
    for file in full_file_path:
        relative_file_path.append(file.replace(basepath, ""))
   
    return relative_file_path

# Use numpy to determine the difference between the 2 arrays
def CompareLists(daList1, daList2):
    diff1 = list(np.setdiff1d(daList1, daList2))
    diff2 = list(np.setdiff1d(daList2, daList1))
    return diff1, diff2

# Use pandas to convert the difference lists to a dataframe then write that dataframe to a .csv
def ToCSV(daTuple, folder1_name, folder2_name):
    today = str(date.today()).replace("-", "_")
    file_name = f"difference_{today}.csv"
    results1 = daTuple[0]
    results2 = daTuple[1]
    
    df = pd.DataFrame(list(zip(results1, results2)), columns =[f"Files not in '{folder2_name}'", f"Files not in '{folder1_name}'"])
    df.to_csv(file_name, index=False)

# Outdated after GUI implementation
if __name__ == "__main__":
    basepath = os.getcwd()
    folder1_name = "folder1"
    folder2_name = "folder2"

    folder1_path = f"{basepath}//{folder1_name}"
    folder2_path = f"{basepath}//{folder2_name}"
    
    folder1_list = GetAllInFolder(folder1_path)
    folder2_list = GetAllInFolder(folder2_path)

    # This will get returned like (['1.txt'], ['2.txt'])
    differences = CompareLists(folder1_list, folder2_list)

    ToCSV(differences, folder1_name, folder2_name)

